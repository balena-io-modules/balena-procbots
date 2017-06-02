"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const yaml = require("js-yaml");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
const NotifyBotPort = 8399;
const ConnectRE = /connects-to:[\s]+(#[0-9]+)/i;
const HqRE = /hq:[\s]+https:\/\/github.com\/resin-io\/hq\/issues\/([0-9]+)/i;
const KeyframeFile = 'keyframe.yml';
const ChangelogFile = 'CHANGELOG.md';
const VirginRef = '0000000000000000000000000000000000000000';
const HqOwner = 'resin-io';
const HqRepo = 'hq';
class NotifyBot extends procbot_1.ProcBot {
    constructor(config) {
        super(config.botName);
        this.checkPush = (_registration, event) => {
            const pushEvent = event.cookedEvent.data;
            const commits = pushEvent.commits;
            const newHash = pushEvent.after;
            const oldHash = pushEvent.before;
            const owner = pushEvent.repository.owner.name;
            const repo = pushEvent.repository.name;
            let keyframeChange = false;
            if ((oldHash === VirginRef) || (newHash === VirginRef)) {
                return Promise.resolve();
            }
            for (const commit of commits) {
                if (_.includes(commit.modified, KeyframeFile)) {
                    keyframeChange = true;
                    break;
                }
            }
            if (!keyframeChange) {
                return Promise.resolve();
            }
            let fileRequest = {
                api: this.githubApi,
                filepath: KeyframeFile,
                owner,
                hash: oldHash,
                repo,
            };
            let oldFile = '';
            let newFile = '';
            return this.retrieveFileFromHash(fileRequest).then((fileContents) => {
                if (!fileContents) {
                    throw new Error(`Couldn't find the old hash for the Keyframe: ${owner}/${repo}:${oldHash}`);
                }
                oldFile = fileContents;
                fileRequest.hash = newHash;
                return this.retrieveFileFromHash(fileRequest);
            }).then((fileContents) => {
                if (!fileContents) {
                    throw new Error(`Couldn't find the old hash for the Keyframe: ${owner}/${repo}:${newHash}`);
                }
                newFile = fileContents;
                const oldComponents = yaml.safeLoad(oldFile).keyframe.components;
                const newComponents = yaml.safeLoad(newFile).keyframe.components;
                const componentVersions = [];
                _.each(newComponents, (value, key) => {
                    const newVersion = value.version;
                    const oldVersion = (oldComponents[key] || {}).version;
                    const componentRepo = value.repository;
                    if (newVersion && repo && (newVersion !== oldVersion)) {
                        componentVersions.push({
                            oldVersion,
                            name: key,
                            newVersion,
                            repo: componentRepo
                        });
                    }
                });
                return Promise.map(componentVersions, (component) => this.getNewPRs(component));
            }).then((components) => {
                return Promise.map(components, (component) => {
                    let versionsMap = [];
                    if (component.versions) {
                        _.each(component.versions, (prs, key) => {
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
            }).catch((err) => {
                this.reportError({
                    brief: `${process.env.NOTIFYBOT_NAME} failed to find Keyframe versions for ${owner}/${repo}`,
                    message: `${process.env.NOTIFYBOT_NAME} failed to find Keyframe versions. The reason ` +
                        `for this is:\r\n${err.message}\r\n` +
                        'Please carry out relevant changes or alert an appropriate admin.',
                    owner,
                    repo,
                    version: 'unknown'
                });
            });
        };
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
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId: config.githubIntegration,
                pem: config.githubPEM,
                type: 'integration'
            },
            pem: config.githubPEM,
            type: 'emitter'
        });
        const frontEmitter = this.addServiceEmitter('front', {
            apiKey: config.frontApiKey,
            type: 'emitter'
        });
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
        const ghHandles = ghEmitter.apiHandle;
        this.githubApi = ghHandles.github;
        const frontHandles = frontEmitter.apiHandle;
        this.frontApi = frontHandles.front;
        this.frontUser = config.frontUser;
        this.frontPassword = config.frontPassword;
        this.frontApiKey = config.frontApiKey;
        ghListener.registerEvent({
            events: ['push'],
            listenerMethod: this.checkPush,
            name: 'CheckMasterPush'
        });
    }
    tracePRAndNotify(prDetails) {
        const repoDetails = this.getRepoDetails(prDetails.repo);
        if (!repoDetails) {
            throw new Error(`Cannot find appropriate repo/owner for ${prDetails.repo}`);
        }
        return Promise.map(prDetails.prs, (pr) => {
            const prData = {
                number: pr,
                owner: repoDetails.owner,
                repo: repoDetails.repo,
            };
            return Promise.join(this.emitterCall(this.githubEmitterName, {
                data: prData,
                method: this.githubApi.issues.getComments,
            }), this.emitterCall(this.githubEmitterName, {
                data: prData,
                method: this.githubApi.pullRequests.get
            }), (comments, pullRequest) => {
                return _.concat(_.flatMap(comments, (comment) => this.matchIssue(comment.body, ConnectRE)), this.matchIssue(pullRequest.body, ConnectRE), _.flatMap(comments, (comment) => this.matchIssue(comment.body, HqRE)), this.matchIssue(pullRequest.body, HqRE));
            }).then((issueNumbers) => {
                return Promise.mapSeries(issueNumbers, (issueNumber) => {
                    let topicIssues;
                    return this.getTopicsOnIssue(issueNumber, repoDetails.owner, repoDetails.repo)
                        .then((results) => {
                        topicIssues = results;
                        return this.retrieveTopics(topicIssues.topics);
                    }).then((conversations) => {
                        let bodyMessage = `Deployed version ${prDetails.version} of ${prDetails.repo} has resolved ` +
                            'the following issues that are attached to this conversation:';
                        _.each(topicIssues.relatedIssues, (issueURL) => {
                            bodyMessage += `\n${issueURL}`;
                        });
                        return Promise.map(conversations, (conversation) => {
                            this.logger.log(logger_1.LogLevel.INFO, `---> Commented on Front ${conversation} for ` +
                                `${prData.owner}/${prData.repo}#${prData.number}:${prDetails.version}`);
                            return this.emitterCall(this.frontEmitterName, {
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
                return this.emitterCall(this.githubEmitterName, {
                    data: prData,
                    method: this.githubApi.pullRequests.get
                }).then((pullRequest) => {
                    this.logger.log(logger_1.LogLevel.INFO, `--> Commented on PR ${prData.owner}/${prData.repo}#` +
                        `${prData.number}:${prDetails.version}`);
                    return this.emitterCall(this.githubEmitterName, {
                        data: {
                            body: `Hi @${pullRequest.user.login}! This PR is now deployed as version ` +
                                `${prDetails.version} on the ${prDetails.environment} environment. Please remember ` +
                                'to publish release notes on the `r/devops` flowdock channel.',
                            number: prData.number,
                            owner: prData.owner,
                            repo: prData.repo,
                        },
                        method: this.githubApi.issues.createComment
                    });
                });
            });
        }).catch((err) => {
            this.reportError({
                brief: 'IssueConversationUpdate',
                message: `Couldn't post to the conversation or PR for the specified issue: ${err}`,
                owner: repoDetails.owner,
                repo: repoDetails.repo,
                version: prDetails.version
            });
        }).return();
    }
    matchIssue(text, regExp) {
        const results = [];
        let match = text.match(regExp);
        if (match) {
            if (!_.includes(results, match[1])) {
                results.push(match[1]);
            }
        }
        return results;
    }
    ;
    getTopicsOnIssue(issueNumber, issueOwner, issueRepo) {
        let followHqIssue = true;
        if (_.startsWith(issueNumber, '#')) {
            issueNumber = issueNumber.substring(1);
            followHqIssue = false;
        }
        const getIssueAndComments = (issue, owner, repo, method) => {
            return Promise.join(this.emitterCall(this.githubEmitterName, {
                data: {
                    number: issue,
                    owner,
                    repo,
                },
                method: this.githubApi.issues.get,
            }), this.emitterCall(this.githubEmitterName, {
                data: {
                    number: issue,
                    owner,
                    repo,
                },
                method: this.githubApi.issues.getComments,
            }), method).catch((err) => {
                if (err.message !== 'Not Found') {
                    throw err;
                }
                return Promise.resolve([]);
            });
        };
        const matchfrontTopics = (issue, comments) => {
            const frontRE = /\[front conversations\]\((.*)\)/i;
            return _.concat(this.matchIssue(issue.body, frontRE), _.flatMap(comments, (comment) => this.matchIssue(comment.body, frontRE)));
        };
        const githubURL = `https://github.com`;
        const relatedIssues = [];
        return getIssueAndComments(issueNumber, issueOwner, issueRepo, (issue, comments) => {
            const hqRefs = _.concat(_.flatMap(comments, (comment) => this.matchIssue(comment.body, HqRE)), this.matchIssue(issue.body, HqRE));
            let frontTopics = matchfrontTopics(issue, comments);
            if (frontTopics.length > 0) {
                relatedIssues.push(`${issue.title}: ${issueRepo}/issues/${issueNumber}`);
            }
            if (!followHqIssue && (hqRefs.length > 0)) {
                return Promise.mapSeries(hqRefs, (hqRef) => {
                    return getIssueAndComments(hqRef, HqOwner, HqRepo, (hqIssue, hqComments) => {
                        const hqTopics = matchfrontTopics(hqIssue, hqComments);
                        if (hqTopics.length > 0) {
                            relatedIssues.push(`${hqIssue.title}: ${githubURL}/${HqOwner}/` +
                                `${HqRepo}/issues/${hqRef}`);
                        }
                        return hqTopics;
                    });
                }).then((hqReffrontTopics) => {
                    return frontTopics.concat(_.flatten(hqReffrontTopics));
                });
            }
            return frontTopics;
        }).then((topics) => {
            return {
                relatedIssues,
                topics
            };
        });
    }
    getNewPRs(component) {
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
            let changeParts = [file];
            if (component.oldVersion) {
                changeParts = file.split(component.oldVersion);
            }
            const versionEntries = changeParts[0].split('## ');
            const versionTracker = {};
            _.each(versionEntries, (versionData) => {
                let verMatches;
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
    retrieveFileFromHash(fileRequest) {
        const request = {
            data: {
                owner: fileRequest.owner,
                path: fileRequest.filepath,
                ref: fileRequest.hash,
                repo: fileRequest.repo,
            },
            method: this.githubApi.repos.getContent
        };
        return this.emitterCall(this.githubEmitterName, request).then((file) => {
            if (!file) {
                return;
            }
            if (file.encoding !== 'base64') {
                this.logger.log(logger_1.LogLevel.WARN, 'Content is not in expected format');
                return;
            }
            return Buffer.from(file.content, 'base64').toString();
        });
    }
    retrieveTopics(topics) {
        return Promise.map(topics, (topic) => {
            const shortenedTopic = topic.substring(topic.lastIndexOf('/') + 1);
            return this.emitterCall(this.frontEmitterName, {
                data: {
                    topic_id: shortenedTopic
                },
                method: this.frontApi.topic.listConversations,
            }).then((conversations) => {
                const convoList = [];
                _.each(conversations._results, (conversation) => {
                    convoList.push(conversation.id);
                });
                return convoList;
            });
        }).then(_.flatten);
    }
    emitterCall(target, context) {
        const request = {
            contexts: {},
            source: process.env.NOTIFYBOT_NAME
        };
        request.contexts[target] = context;
        return this.dispatchToEmitter(target, request).then((data) => {
            if (data.err) {
                if (target === this.githubEmitterName) {
                    const ghError = JSON.parse(data.err.message);
                    throw new Error(ghError.message);
                }
                throw data.err;
            }
            return data.response;
        });
    }
    getRepoDetails(fullRepo) {
        const urlComps = fullRepo.match(/^.*:\/\/.*\/(.*)\/(.*)$/);
        if (!urlComps) {
            return;
        }
        return {
            owner: urlComps[1],
            repo: urlComps[2]
        };
    }
    reportError(error) {
        this.logger.alert(logger_1.AlertLevel.ERROR, `${error.message}: ${error.owner}/${error.repo}, v: ${error.version}`);
    }
}
exports.NotifyBot = NotifyBot;
function createBot() {
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
exports.createBot = createBot;

//# sourceMappingURL=notifybot.js.map
