/*
Copyright 2017 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// VersionBot listens for merges of a PR to the `master` branch and then
// updates any packages for it.
import * as Promise from 'bluebird';
import { Front, TopicConversations } from 'front-sdk';
import * as GithubApi from 'github';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import * as GithubApiTypes from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { FrontEmitRequestContext, FrontHandle } from '../services/front-types';
import { GithubEmitRequestContext, GithubHandle, GithubRegistration } from '../services/github-types';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEvent } from '../services/service-types';
import { AlertLevel, LogLevel } from '../utils/logger';

// Specific to NotifyBot
interface RepoDetails {
    owner: string;
    repo: string;
}

interface DeployedPR {
    environment: string;
    repo: string;
    version: string;
    prs: string[];
}

interface HashedFileRequest {
    filepath: string;
    hash: string;
    owner: string;
    repo: string;
}

interface NotifyBotError {
    brief: string;
    message: string;
    owner: string;
    repo: string;
}

interface VersionTracker {
    [version: string]: string[];
}

interface ComponentTracker {
    name: string;
    oldVersion: string;
    newVersion: string;
    repo: string;
    versions?: VersionTracker;
}

export interface NotifyBotConfig {
    botName: string;
    githubIntegration: string;
    githubPEM: string;
    githubSecret: string;
    frontApiKey: string;
    frontUser: string;
    frontPassword: string;
}

interface TopicIssues {
    relatedIssues: string[];
    topics: string[];
}

const NotifyBotPort = 8399; // Not a listed registered port

const KeyframeFile = 'keyframe.yml';
const ChangelogFile = 'CHANGELOG.md';
const VirginRef = '0000000000000000000000000000000000000000';
const HqOwner = 'resin-io';
const HqRepo = 'hq';

// The VersionBot is built on top of GithubBot, which does all the heavy lifting and scheduling.
// It is designed to check for valid `versionist` commit semantics and alter (or merge) a PR
// accordingly.
export class NotifyBot extends ProcBot {
    // Listener and emitter handles
    private githubListenerName: string;
    private githubEmitterName: string;
    private frontEmitterName: string;
    private frontUser: string;
    private frontPassword: string;
    private frontApiKey: string;
    private frontApi: Front;
    private githubApi: GithubApi;

    // Name ourself and register the events and labels we're interested in.
    constructor(config: NotifyBotConfig) {
        // This is the VersionBot.
        super(config.botName);

        // Create a new listener for Github with the right Integration ID.
        const ghListener = this.addServiceListener('github', {
            client: config.botName,
            loginType: {
                integrationId: config.githubIntegration,
                pem: config.githubPEM,
                type: 'integration'
            },
            path: '/notifyhooks',
            port: NotifyBotPort,
            type: 'listener',
            webhookSecret: config.githubSecret
        });

        // Create a new emitter with the right Integration ID.
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId: config.githubIntegration,
                pem: config.githubPEM,
                type: 'integration'
            },
            pem: config.githubPEM,
            type: 'emitter'
        });

        // Create a new emitter.
        const frontEmitter = this.addServiceEmitter('front', {
            apiKey: config.frontApiKey,
            type: 'emitter'
        });

        // Throw if we didn't get either of the services.
        if (!ghListener) {
            throw new Error("Couldn't create a Github listener");
        }
        if (!ghEmitter) {
            throw new Error("Couldn't create a Github emitter");
        }
        if (!frontEmitter) {
            throw new Error("Couldn't create a Front emitter");
        }
        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;
        this.frontEmitterName = frontEmitter.serviceName;

        // Get the SDK handles
        const ghHandles = <GithubHandle>ghEmitter.apiHandle;
        this.githubApi = ghHandles.github;
        const frontHandles = <FrontHandle>frontEmitter.apiHandle;
        this.frontApi = frontHandles.front;

        this.frontUser = config.frontUser;
        this.frontPassword = config.frontPassword;
        this.frontApiKey = config.frontApiKey;

        // Listen for push events on the repositories.
        ghListener.registerEvent({
                events: [ 'push' ],
                listenerMethod: this.checkPush,
                name: 'CheckMasterPush'
        });
    }

    protected checkPush = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        const pushEvent = <GithubApiTypes.PushEvent>event.cookedEvent.data;
        const commits = pushEvent.commits;
        const newHash = pushEvent.after;
        const oldHash = pushEvent.before;
        const owner = pushEvent.repository.owner.name;
        const repo = pushEvent.repository.name;
        let keyframeChange = false;

        // If a reference is a 'virgin' (00000...) then we totally ignore this.
        // It's probably a tag or a new branch. Either way, it holds no interest to us.
        if ((oldHash === VirginRef) || (newHash === VirginRef)) {
            return Promise.resolve();
        }

        // We're looking for the keyframe file in any of the commits.
        // If we find it, then this push requires us to get the difference between
        // versions.
        // Note this only works on modified files. Adding or removing a keyframe file makes
        // no sense logistically for NotifyBot.
        for (const commit of commits) {
            // Are any of the modified files the Keyframe?
            if (_.includes(commit.modified, KeyframeFile)) {
                keyframeChange = true;
                break;
            }
        }

        if (!keyframeChange) {
            return Promise.resolve();
        }

        // Now get copies of the Keyframe file pre and post changes.
        // We'll decode each of these into objects so we can scan through and
        // determine the changes in version numbers for all components.
        let fileRequest = {
            api: this.githubApi,
            filepath: KeyframeFile,
            owner,
            hash: oldHash,
            repo,
        };
        let oldFile = '';
        let newFile = '';
        return this.retrieveFileFromHash(fileRequest).then((fileContents: string | void) => {
            if (!fileContents) {
                throw new Error(`Couldn't find the old hash for the Keyframe: ${owner}/${repo}:${oldHash}`);
            }

            oldFile = fileContents;
            fileRequest.hash = newHash;
            return this.retrieveFileFromHash(fileRequest);
        }).then((fileContents: string | void) => {
            if (!fileContents) {
                throw new Error(`Couldn't find the old hash for the Keyframe: ${owner}/${repo}:${newHash}`);
            }

            newFile = fileContents;

            // Both of these files are YAML. Decode the YAML and look specifically for
            // the versions of components, noting the old version and new version for each:
            //  * No old version, we must go through every version in a Changelog
            //  * Old version, we go through every version from old + 1 to new (might just be one)
            //  * No new version, we abort
            const oldComponents = yaml.safeLoad(oldFile).keyframe.components;
            const newComponents = yaml.safeLoad(newFile).keyframe.components;

            // Track every new version by trying to match a component in the new version
            // with a component in the old.
            const componentVersions: ComponentTracker[] = [];
            _.each(newComponents, (value, key: string) => {
                // Try and find the old version of the component.
                const newVersion = value.version;
                const oldVersion = (oldComponents[key] || {}).version;
                const componentRepo = value.repository;

                // If we have a new version, and it doesn't match the old version and has a repo,
                // then we want to do something with it.
                if (newVersion && repo && (newVersion !== oldVersion)) {
                    componentVersions.push({
                        oldVersion,
                        name: key,
                        newVersion,
                        repo: componentRepo
                    });
                }
            });

            // We now have a set of components. For each of them, we now go through the process
            // of following the Changelogs to find fixed issues.
            // Any thrown error here needs to abort the run, as it means fundamentally something is
            // wrong with the released versions.
            return Promise.map(componentVersions, (component) => this.getNewPRs(component));
        }).then((components: ComponentTracker[]) => {
            // We've a list of components and the PRs for each version.
            // So, for each version we now harvest the relevant PRs and start the check
            // backwards for Front URLs.
            return Promise.map(components, (component) => {
                let versionsMap: Array<Promise<void>> = [];
                if (component.versions) {
                    _.each(component.versions, (prs, key: string) => {
                        versionsMap.push(this.tracePRAndNotify({
                            environment: repo,
                            repo: component.repo,
                            version: key,
                            prs
                        }));
                    });
                }

                return Promise.all(versionsMap);
            }).return();
        }).catch((err: Error) => {
            // Call the VersionBot error specific method if this wasn't the short circuit for
            // committed code.
            this.reportError({
                brief: `${process.env.NOTIFYBOT_NAME} failed to find Keyframe versions for ${owner}/${repo}`,
                message: `${process.env.NOTIFYBOT_NAME} failed to find Keyframe versions. The reason ` +
                    `for this is:\r\n${err.message}\r\n` +
                    'Please carry out relevant changes or alert an appropriate admin.',
                owner,
                repo
            });
        });

        // We have a list of PRs for each component.
        // For each PR go through and run the check to look for connected issues.
        // For each issue, work through the chain getting any Front threads.
    }

    private tracePRAndNotify(prDetails: DeployedPR): Promise<void> {
        // RegExp checking for issue cross referencing.
        const connectRE = /connects[\s]+to[\s]+#([0-9]+)/i;
        const repoDetails = this.getRepoDetails(prDetails.repo);

        if (!repoDetails) {
            throw new Error(`Cannot find appropriate repo/owner for ${prDetails.repo}`);
        }

        return Promise.map(prDetails.prs, (pr) => {
            // Get comments and commits for the PR.
            // Look for 'Connects to #<x>' to get issue numbers. We *only* want local
            // issue numbers.
            const prData = {
                number: pr,
                owner: repoDetails.owner,
                repo: repoDetails.repo,
            };
            return Promise.join(this.emitterCall(this.githubEmitterName, {
                    data: prData,
                    method: this.githubApi.issues.getComments,
                }),
                this.pagedGithubCall({
                    data: prData,
                    method: this.githubApi.pullRequests.getCommits,
                }, 30),
                (comments: GithubApiTypes.IssueComment[], commits: GithubApiTypes.Commit[]) => {
                    // Find reference to parent issues. We should not have any
                    // Front conversations in a PR.
                    return _.concat(_.flatMap(comments, (comment) => this.matchIssue(comment.body, connectRE)),
                        _.flatMap(commits, (commit) => this.matchIssue(commit.commit.message, connectRE)));
                }
            ).then((issueNumbers) => {
                return Promise.mapSeries(issueNumbers, (issueNumber) => {
                    let topicIssues: TopicIssues;
                    return this.getTopicsOnIssue(issueNumber, repoDetails.owner, repoDetails.repo)
                    .then((results) => {
                        topicIssues = results;
                        return this.retrieveTopics(topicIssues.topics);
                    }).then((conversations: string[]) => {
                        // Now we have all Front threads. Examine each of them for
                        // their IDs, and then post a private comment into them to
                        // note updated references.
                        let bodyMessage = `Deployed version ${prDetails.version} of ${prDetails.repo} has resolved ` +
                            'the following issues that are attached to this conversation:';
                        _.each(topicIssues.relatedIssues, (issueURL) => {
                            bodyMessage += `\n${issueURL}`;
                        });

                        return Promise.map(conversations, (conversation) => {
                            return this.emitterCall(this.frontEmitterName,{
                                data: {
                                    author_id: `alt:email:${this.frontUser}`,
                                    body: bodyMessage,
                                    conversation_id: conversation,
                                },
                                method: this.frontApi.comment.create,
                            });
                        });
                    });
                });
            }).then(() => {
                // Finally comment on the actual PR saying that the component with this
                // PR in has been deployed, and in which version. Ping the author directly
                // so they know.

                // If we don't already have the full prDetails, we need to get them
                // earlier, and *not here*.
                // We should have all the info needed to update the PR directly.
                // Also check to ensure we haven't already commented on it.
                return this.emitterCall(this.githubEmitterName,
                    {
                       data: prData,
                        method: this.githubApi.pullRequests.get
                    }
                ).then((pullRequest) => {
                    return this.emitterCall(this.githubEmitterName, {
                        data: {
                            body: `Hi @${pullRequest.user.login}! This PR is now deployed as version ` +
                                `${prDetails.version} on the ${prDetails.environment} environment. Please remember ` +
                                'to publish release notes on the `r/devops` flowdock channel.',
                            number: prData.number,
                            owner: prData.owner,
                            repo: prData.repo,
                        },
                        method: this.githubApi.pullRequests.createComment
                    });
                });
            });
        }).catch((err: Error) => {
            this.reportError({
                brief: 'IssueConversationUpdate',
                message: `Couldn't post to the conversation for the specified issue: ${err}`,
                owner: repoDetails.owner,
                repo: repoDetails.repo,
            });
        }).return();
    }

    private matchIssue(text: string, regExp: RegExp): string[] {
        const results: string[] = [];
        let match: RegExpMatchArray | null = text.match(regExp);
        if (match) {
            if (!_.includes(results, match[1])) {
                results.push(match[1]);
            }
        }

        return results;
    };

    // Retrieve topics for an issue.
    // This goes through an issue and associated HQ issues connected to find
    // the relevant Front topic URLs for it.
    private getTopicsOnIssue(issueNumber: string, issueOwner: string, issueRepo: string): Promise<TopicIssues> {
        // We need to look both at the issue body itself and all comments to
        // get potential Front conversations as well as links to HQ.
        const getIssueAndComments = (issue: string, owner: string, repo: string, method: object) => {
            return Promise.join(
                this.emitterCall(this.githubEmitterName, {
                    data: {
                        number: issue,
                        owner,
                        repo,
                    },
                    method: this.githubApi.issues.get,
                }),
                this.emitterCall(this.githubEmitterName, {
                    data: {
                        number: issue,
                        owner,
                        repo,
                    },
                    method: this.githubApi.issues.getComments,
                }),
                method
            ).catch((err: Error) => {
                // If we couldn't find the comments (or in fact the PR, but that must exist
                // as we've been sent the event), then it's not an error. We still want to
                // post on the PR that a version has been deployed, even though there may
                // be no Front topics.
                if (err.message !== 'Not Found') {
                    throw err;
                }

                return Promise.resolve([]);
            });
        };
        const matchfrontTopics = (issue: GithubApiTypes.Issue, comments: GithubApiTypes.IssueComment[]) => {
            const frontRE = /\[front conversations\]\((.*)\)/i;

            // Match any Front conversations or HQ ref issues.
            return _.concat(this.matchIssue(issue.body, frontRE),
                _.flatMap(comments, (comment) => this.matchIssue(comment.body, frontRE)));
        };
        const githubURL = `https://github.com`;
        const relatedIssues: string[] = [];

        return getIssueAndComments(issueNumber, issueOwner, issueRepo,
        (issue: GithubApiTypes.Issue, comments: GithubApiTypes.IssueComment[]) => {
            const hqRE = /connects[\s]+to[\s]+resin-io\/hq#([0-9]+)/i;
            const hqRefs = _.flatMap(comments, (comment) => this.matchIssue(comment.body, hqRE));

            // Match any Front conversations or HQ ref issues.
            let frontTopics = matchfrontTopics(issue, comments);
            if (frontTopics.length > 0) {
                relatedIssues.push(`${issue.title}: ${issueRepo}/issues/${issueNumber}`);
            }

            // If we have any HQ refs, we need to now do the same thing
            // with those.
            frontTopics = _.concat(frontTopics, this.matchIssue(issue.body, hqRE));
            if (hqRefs.length > 0) {
                return Promise.map(hqRefs, (hqRef) => {
                    return getIssueAndComments(hqRef, HqOwner, HqRepo,
                        (hqIssue: GithubApiTypes.Issue, hqComments: GithubApiTypes.IssueComment[]) => {
                            const hqTopics = matchfrontTopics(hqIssue, hqComments);
                            if (hqTopics.length > 0) {
                                relatedIssues.push(`${hqIssue.title}: ${githubURL}/${HqOwner}/` +
                                    `${HqRepo}/issues/${hqRef}`);
                            }
                            return hqTopics;
                        }
                    );
                }).then((hqReffrontTopics: string[][]) => {
                    return frontTopics.concat(_.flatten(hqReffrontTopics));
                });
            }

            // Else just return the already resolved topics.
            return frontTopics;
        }).then((topics) => {
            return {
                relatedIssues,
                topics
            };
        });
    }

    // Retrieve the PRs for a component, along with the version they apply to.
    private getNewPRs(component: ComponentTracker): Promise<ComponentTracker> {
        // Get the changelog for the component from its `master`, as this file
        // *should* include all given versions. If it doesn't, then something is broken
        // or the keyframe is incorrect.
        const repo = this.getRepoDetails(component.repo);

        if (!repo) {
            throw new Error(`Cannot find appropriate repo/owner for ${component.repo}`);
        }

        const fileRequest = {
            api: this.githubApi,
            filepath: ChangelogFile,
            hash: 'HEAD',
            owner: repo.owner,
            repo: repo.repo,
        };
        return this.retrieveFileFromHash(fileRequest).then((file) => {
            if (!file) {
                throw new Error(`Couldn't find the CHANGELOG.md in ${repo.owner}/${repo.repo}`);
            }

            // We have the Changelog, we want to cull any versions which aren't
            // relevant by removing them. Do this by splitting the lines based on
            // the old version.
            let changeParts = [ file ];
            if (component.oldVersion) {
                changeParts = file.split(component.oldVersion);
            }

            // We need to search the first entry in the array and split on every version
            // so we know which versions to report back.
            const versionEntries = changeParts[0].split('## ');

            // Try and find a PR for each part. If we do, we store every PR we find
            // in a version tracker.
            const versionTracker: VersionTracker = {};
            _.each(versionEntries, (versionData) => {
                let verMatches: RegExpExecArray | null;
                const versionMatch = versionData.match(/v([0-9]+\.[0-9]+\.[0-9]+)/);
                if (versionMatch) {
                    const version = versionMatch[1];
                    const matchRE = /\*[\s]+.*[\s]+#([0-9]+).*/gm;
                    verMatches = matchRE.exec(versionData);
                    while (verMatches) {
                        if (!versionTracker[version]) {
                            versionTracker[version] = [];
                        }
                        versionTracker[version].push(verMatches[1]);
                        verMatches = matchRE.exec(versionData);
                    }
                }
            });
            component.versions = versionTracker;

            return component;
        });
    }

    // Retrieve a file from a repository given a full tree path and a commit hash.
    private retrieveFileFromHash(fileRequest: HashedFileRequest): Promise<string | void> {
        const request = {
            data: {
                owner: fileRequest.owner,
                path: fileRequest.filepath,
                ref: fileRequest.hash,
                repo: fileRequest.repo,
            },
            method: this.githubApi.repos.getContent
        };

        // Use the parent method to get the configuration via the GH emitter, but then
        // return it so we can decode it before processing it.
        return this.emitterCall(this.githubEmitterName, request).then((file: GithubApiTypes.FileContent) => {
            if (!file) {
                return;
            }

            if (file.encoding !== 'base64') {
                this.logger.log(LogLevel.WARN, 'Content is not in expected format');
                return;
            }

            // Convert from Base64 into valid content.
            return Buffer.from(file.content, 'base64').toString();
        });
    }

    private retrieveTopics(topics: string[]): Promise<string[]> {
        // We do all of this via request, as this is not the 'proper' Front API.
        // Retrieve the formal topic ID for the shortened form.
        return Promise.map(topics, (topic) => {
            const shortenedTopic = topic.substring(topic.lastIndexOf('/') + 1);
            return this.emitterCall(this.frontEmitterName, {
                data: {
                    topic_id: shortenedTopic
                },
                method: this.frontApi.topic.listConversations,
            }).then((conversations: TopicConversations) => {
                const convoList: string[] = [];
                _.each(conversations._results, (conversation) => {
                    convoList.push(conversation.id);
                });
                return convoList;
            });
        }).then(_.flatten);
    }

    // A paged call will continue to make calls to githubCall with incremented pages
    // until the response is either an empty list or less than the max number of entries.
    private pagedGithubCall(callData: GithubEmitRequestContext, maxEntries: number): Promise<any[]> {
        let results: any = [];

        const getPage = (page: number): Promise<any[]> => {
            callData.data.page = page;
            return this.emitterCall(this.githubEmitterName, callData).then((response: any[]) => {
                results = results.concat(response);
                if (response.length >= maxEntries) {
                    return getPage(page + 1);
                }

                return results;
            });
        };

        return getPage(0);
    }

    private emitterCall(target: string, context: GithubEmitRequestContext | FrontEmitRequestContext): Promise<any> {
        const request: ServiceEmitRequest = {
            contexts: {},
            source: process.env.NOTIFYBOT_NAME
        };
        request.contexts[target] = context;

        return this.dispatchToEmitter(target, request).then((data: ServiceEmitResponse) => {
            // On an error, throw.
            if (data.err) {
                // Specifically throw the error message if it's Github.
                if (target === this.githubEmitterName) {
                    const ghError = JSON.parse(data.err.message);
                    throw new Error(ghError.message);
                }

                // If Front, just throw.
                throw data.err;
            }

            return data.response;
        });
    }

    private getRepoDetails(fullRepo: string): RepoDetails | void {
        const urlComps = fullRepo.match(/^.*:\/\/.*\/(.*)\/(.*)$/);
        if (!urlComps) {
            return;
        }

        return {
            owner: urlComps[1],
            repo: urlComps[2]
        };
    }

    private reportError(error: NotifyBotError): void {
        this.logger.alert(AlertLevel.ERROR, `${error.message}: ${error.owner}/${error.repo}`);
    }
}

// Export the VersionBot to the app.
// We register the Github events we're interested in here.
export function createBot(): NotifyBot {
    const notifyBotConfig = {
        botName: process.env.NOTIFYBOT_NAME,
        frontApiKey: process.env.NOTIFYBOT_FRONT_API_KEY,
        frontPassword: process.env.NOTIFYBOT_FRONT_PASSWORD,
        frontUser: process.env.NOTIFYBOT_FRONT_USERNAME,
        githubIntegration: process.env.NOTIFYBOT_GITHUB_INTEGRATION_ID,
        githubPEM: process.env.NOTIFYBOT_GITHUB_PEM,
        githubSecret: process.env.NOTIFYBOT_GITHUB_WEBHOOK_SECRET,
    };
    _.each(notifyBotConfig, (value) => {
        if (!value) {
            throw new Error('At least one required envvar for NotifyBot is missing');
        }
    });

    return new NotifyBot(notifyBotConfig);
}
