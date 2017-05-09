/*
Copyright 2016-2017 Resin.io

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
import * as ChildProcess from 'child_process';
import * as FS from 'fs';
import * as GithubApi from 'github';
import * as _ from 'lodash';
import * as path from 'path';
import { cleanup, track } from 'temp';
import * as GithubApiTypes from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { ProcBotConfiguration } from '../framework/procbot-types';
import { FlowdockEmitRequestContext } from '../services/flowdock-types';
import { GithubCookedData, GithubEmitRequestContext, GithubRegistration } from '../services/github-types';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEvent } from '../services/service-types';
import { AlertLevel, LogLevel } from '../utils/logger';

// Exec technically has a binding because of it's Node typings, but promisify doesn't include
// the optional object (we need for CWD). So we need to special case it.
const exec: (command: string, options?: any) => Promise<{}> = Promise.promisify(ChildProcess.exec);
const fsReadFile = Promise.promisify(FS.readFile);
const fsFileExists = Promise.promisify(FS.stat);
const tempMkdir = Promise.promisify(track().mkdir);
const tempCleanup = Promise.promisify(cleanup);

// Specific to VersionBot
interface FileMapping {
    file: string;
    encoding: string;
}

interface EncodedFile extends FileMapping {
    treeEntry: GithubApiTypes.TreeEntry;
    blobSha: string;
};

interface RepoFileData {
    owner: string;
    repo: string;
    branchName: string;
    version: string;
    files: FileMapping[];
}

interface VersionistData {
    authToken: string;
    branchName: string;
    fullPath: string;
    repoFullName: string;
    files?: string[];
    version?: string;
}

interface MergeData {
    commitVersion: string;
    owner: string;
    prNumber: number;
    repoName: string;
}

interface VersionBotError {
    githubApiCalls: GithubApi;
    brief: string;
    message: string;
    number: number;
    owner: string;
    repo: string;
}

interface FSError {
    code: string;
    message: string;
}

interface VersionBotConfiguration extends ProcBotConfiguration {
    procbot: {
        versionbot: {
            minimum_approvals?: number;
            approved_reviewers?: string[];
            maintainers?: string[];
        };
    };
}

interface StatusResult {
    name: string;
    state: StatusChecks;
}

enum StatusChecks { Passed, Pending, Failed };

type GenericPullRequestEvent = GithubApiTypes.PullRequestEvent | GithubApiTypes.PullRequestReviewEvent;

const MergeLabel = 'procbots/versionbot/ready-to-merge';
const IgnoreLabel = 'procbots/versionbot/no-checks';

// The VersionBot is built on top of GithubBot, which does all the heavy lifting and scheduling.
// It is designed to check for valid `versionist` commit semantics and alter (or merge) a PR
// accordingly.
export class VersionBot extends ProcBot {
    // Listener and emitter handles
    private githubListenerName: string;
    private githubEmitterName: string;
    private flowdockEmitterName: string;

    // Name ourself and register the events and labels we're interested in.
    constructor(integration: number, name: string, pemString: string, webhook: string) {
        // This is the VersionBot.
        super(name);

        // Create a new listener for Github with the right Integration ID.
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/webhooks',
            port: 4567,
            type: 'listener',
            webhookSecret: webhook
        });

        // Create a new emitter with the right Integration ID.
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            pem: pemString,
            type: 'emitter'
        });

        // Throw if we didn't get either of the services.
        if (!ghListener) {
            throw new Error("Couldn't create a Github listener");
        }
        if (!ghEmitter) {
            throw new Error("Couldn't create a Github emitter");
        }
        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;

        // Create a new Flowdock emitter, should we need one.
        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            const fdEmitter = this.addServiceEmitter('flowdock');

            if (!fdEmitter) {
                throw new Error("Couldn't create a Flowdock emitter");
            }
            this.flowdockEmitterName = fdEmitter.serviceName;
        }

        // We have two different WorkerMethods here:
        // 1) Status checks on PR open and commits
        // 2) PR review and label checks for merge
        _.forEach([
            {
                events: [ 'pull_request' ],
                listenerMethod: this.checkVersioning,
                name: 'CheckVersionistCommitStatus',
                suppressionLabels: [ IgnoreLabel ]
            },
            {
                events: [ 'pull_request', 'pull_request_review' ],
                listenerMethod: this.mergePR,
                name: 'CheckForReadyMergeState',
                suppressionLabels: [ IgnoreLabel ],
                triggerLabels: [ MergeLabel ]
            },
            // Should a status change occur (Jenkins, VersionBot, etc. all succeed)
            // then check versioning and potentially go to a merge to master.
            {
                events: [ 'status' ],
                listenerMethod: this.statusChange,
                name: 'StatusChangeState',
                suppressionLabels: [ IgnoreLabel ],
                triggerLabels: [ MergeLabel ]
            }
        ], (reg: GithubRegistration) => {
            ghListener.registerEvent(reg);
        });
    }

    // On a status change, we need to see if there's anything to merge.
    protected statusChange = (registration: GithubRegistration, event: ServiceEvent): Promise<void | void[]> => {
        // We now use the data from the StatusEvent to mock up a PullRequestEvent with enough
        // data to carry out the checks.
        const splitRepo = event.cookedEvent.data.name.split('/');
        const owner = splitRepo[0];
        const repo = splitRepo[1];
        const commitSha = event.cookedEvent.data.sha;
        const branches = event.cookedEvent.data.branches;

        if (!event.cookedEvent.githubApi) {
            throw new Error('No Github API instance found');
        }
        const ghApiCalls: GithubApi = event.cookedEvent.githubApi;

        // If we made the status change, we stop now!
        if (event.cookedEvent.data.context === 'Versionist') {
            return Promise.resolve();
        }

        // Get all PRs for each named branch.
        // We *only* work on open states.
        return Promise.map(branches, (branch: GithubApiTypes.StatusEventBranch) => {
            return this.githubCall({
                data: {
                    head: `${owner}:${branch.name}`,
                    owner,
                    repo,
                    state: 'open'
                },
                method: ghApiCalls.pullRequests.getAll
            });
        }).then((prs: GithubApiTypes.PullRequest[]) => {
            let prEvents: ServiceEvent[] = [];

            // For each PR, attempt to match the SHA to the head SHA. If we get a match
            // we create a new prInfo and then hand them all to another map.
            prs = _.flatten(prs);
            _.each(prs, (pullRequest) => {
                if (pullRequest.head.sha === commitSha) {
                    prEvents.push({
                        cookedEvent: {
                            data: {
                                action: 'synchronize',
                                pull_request: pullRequest,
                                sender: {
                                    login: pullRequest.user.login
                                }
                            },
                            githubApi: event.cookedEvent.githubApi,
                            type: 'pull_request'
                        },
                        rawEvent: {
                            pull_request: pullRequest,
                            sender: {
                                login: pullRequest.user.login
                            }
                        },
                        source: process.env.VERSIONBOT_NAME
                    });
                }
            });

            // For every one of these, call checkVersioning.
            return Promise.map(prEvents, (prEvent) => {
                return this.checkVersioning(registration, prEvent);
            });
        });
    }

    // Checks the newly opened PR and its commits.
    //  1. Triggered by an 'opened' or 'synchronize' event.
    //  2. If any PR commit has a 'Change-Type: <type>' commit, we create a status approving the PR.
    //  3. If no PR commit has a 'Change-Type: <type>' commit, we create a status failing the PR.
    protected checkVersioning = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        const pr = event.cookedEvent.data.pull_request;
        const head = event.cookedEvent.data.pull_request.head;
        const owner = head.repo.owner.login;
        const name = head.repo.name;

        if (!event.cookedEvent.githubApi) {
            throw new Error('No Github API instance found');
        }
        const ghApiCalls: GithubApi = event.cookedEvent.githubApi;

        // Only for opened or synced actions.
        if ((event.cookedEvent.data.action !== 'opened') && (event.cookedEvent.data.action !== 'synchronize') &&
            (event.cookedEvent.data.action !== 'labeled')) {
            return Promise.resolve();
        }

        this.logger.log(LogLevel.INFO, `Checking version for ${owner}/${name}#${pr.number}`);
        return this.githubCall({
            data: {
                owner,
                number: pr.number,
                repo: name,
            },
            method: ghApiCalls.pullRequests.getCommits
        }).then((commits: GithubApiTypes.Commit[]) => {
            let changetypeFound: boolean = false;
            // Go through all the commits. We're looking for, at a minimum, a 'change-type:' tag.
            for (let commit of commits) {
                const commitMessage: string = commit.commit.message;

                // Split the commits up into lines, and find the last line with any whitespace in.
                // Whilst we tend to ask for:
                //  <header>
                //
                //  <body>
                //
                //  <footer>
                // This code will actually let you get away with:
                //  <header>
                //
                //  <footer>
                // As sometimes a development patch may be self-explanatory in the header alone.
                const lines = commitMessage.split('\n');
                const lastLine = _.findLastIndex(lines, (line) => line.match(/^\s*$/) );

                // If there's no match, then at the very least there's no footer, and the commit
                // is in the wrong format (as there's no text to use in the logs).
                if (lastLine > 0) {
                    // We should have a line index to join from, now.
                    lines.splice(0, lastLine);
                    const footer = lines.join('\n');
                    const invalidCommit = !footer.match(/^change-type:\s*(patch|minor|major)\s*$/mi);

                    if (!invalidCommit) {
                        changetypeFound = true;
                        break;
                    }
                }
            }

            // If we found a change-type message, then mark this commit as ok.
            if (changetypeFound) {
                return this.githubCall({
                    data: {
                        context: 'Versionist',
                        description: 'Found a valid Versionist `Change-Type` tag',
                        owner,
                        repo: name,
                        sha: head.sha,
                        state: 'success'
                    },
                    method: ghApiCalls.repos.createStatus
                });
            }

            // Else we mark it as having failed and we inform the user directly in the PR.
            this.logger.log(LogLevel.INFO, "No valid 'Change-Type' tag found, failing last commit " +
                `for ${owner}/${name}#${pr.number}`);
            return this.githubCall({
                data: {
                    context: 'Versionist',
                    description: 'None of the commits in the PR have a `Change-Type` tag',
                    owner,
                    repo: name,
                    sha: head.sha,
                    state: 'failure'
                },
                method: ghApiCalls.repos.createStatus,
            }).then(() => {
                // We only complain on opening. Either at that point it'll be fixed, or we
                // simply don't pass it in future. This stops the PR being spammed on status changes.
                if (event.cookedEvent.data.action === 'opened') {
                    return this.githubCall({
                        data: {
                            body: `@${event.cookedEvent.data.sender.login}, please ensure that at least one commit ` +
                                'contains a `Change-Type:` tag.',
                            owner,
                            number: pr.number,
                            repo: name,
                        },
                        method: ghApiCalls.issues.createComment,
                    });
                }
            });
        }).then(() => {
            // Get the labels for the PR.
            return this.githubCall({
                data: {
                    number: pr.number,
                    owner,
                    repo: name
                },
                method: ghApiCalls.issues.getIssueLabels
            });
        }).then((labels: GithubApiTypes.IssueLabel[]) => {
            // If we don't have a relevant label for merging, we don't proceed.
            if (_.some(labels, (label) => label.name === MergeLabel)) {
                return this.githubCall({
                    data: {
                        number: pr.number,
                        owner,
                        repo: name
                    },
                    method: ghApiCalls.pullRequests.get
                }).then((mergePr: GithubApiTypes.PullRequest) => {
                    if (mergePr.state === 'open') {
                        return this.finaliseMerge(event.cookedEvent.data, mergePr, ghApiCalls);
                    }
                });
            }
        }).catch((err: Error) => {
            // Call the VersionBot error specific method.
            this.reportError({
                brief: `${process.env.VERSIONBOT_NAME} check failed for ${owner}/${name}#${pr.number}`,
                githubApiCalls: ghApiCalls,
                message: `${process.env.VERSIONBOT_NAME} failed to carry out a status check for the above pull ` +
                    `request here: ${pr.html_url}. The reason for this is:\r\n${err.message}\r\n` +
                    'Please carry out relevant changes or alert an appropriate admin.',
                number: pr.number,
                owner,
                repo: name
            });
        });
    }

    // Merges a PR, if appropriate:
    //  1. Triggered by a 'labeled' event ('procbots/versionbot/ready-to-merge') or a
    //     'pull_request_review_comment'
    //  2. Checks all review comments to ensure that at least one approves the PR (and that no comment
    //     that may come after it includes a 'CHANGES_REQUESTED' state).
    //  3. Commit new version upped files to the branch, which will cause a 'synchronized' event,
    //     which will finalise the merge.
    //
    // It should be noted that this will, of course, result in a 'closed' event on a PR, which
    // in turn will feed into the 'generateVersion' method below.
    protected mergePR = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        // States for review comments are:
        //  * COMMENT
        //  * CHANGES_REQUESTED
        //  * APPROVED
        //
        // We *only* go through with a merge should:
        //  * The 'procbots/versionbot/ready-to-merge' label appear on the PR issue
        //  * There is an 'APPROVED' review comment *and* no comment after is of state 'CHANGES_REQUESTED'
        // The latter overrides the label should it exist, as it will be assumed it is in error.
        const cookedData: GithubCookedData = event.cookedEvent;
        const data: GenericPullRequestEvent = cookedData.data;
        const pr = data.pull_request;
        const head = data.pull_request.head;
        const owner = head.repo.owner.login;
        const repo = head.repo.name;
        const repoFullName = `${owner}/${repo}`;
        let newVersion: string;
        let fullPath: string;
        let branchName: string;
        let prInfo: GithubApiTypes.PullRequest;
        let botConfig: VersionBotConfiguration;

        if (!event.cookedEvent.githubApi) {
            throw new Error('No Github API instance found');
        }
        const ghApiCalls: GithubApi = event.cookedEvent.githubApi;

        // Check the action on the event to see what we're dealing with.
        switch (cookedData.data.action) {
            // Submission is a PR review
            case 'submitted':
            case 'labeled':
                break;

            default:
                // We have no idea what sparked this, but we're not doing anything!
                return Promise.resolve();
        }

        this.logger.log(LogLevel.INFO, `Attempting merge for ${owner}/${repo}#${pr.number}`);

        // There is currently an issue with the Github API where PR reviews cannot be retrieved
        // for private repositories. This means we can't check to ensure an APPROVED review exists
        // before attempting to merge. It has been agreed that, instead, we will await for the
        // maintainer label to be applied instead.
        // The below code needs reinstating once Github fix their API.
        // There's an issue about this here: https://github.com/resin-io-modules/resin-procbots/issues/31
        /*
        // Get the reviews for the PR.
        return this.gitCall(githubApi.pullRequests.getReviews, {
            number: pr.number,
            owner,
            repo
        }).then((reviews: GithubApiTypes.Review[]) => {
            // Cycle through reviews, ensure that any approved review occurred after any requiring changes.
            let approved = false;
            if (reviews) {
                reviews.forEach((review: GithubApiTypes.Review) => {
                    if (review.state === 'APPROVED') {
                        approved = true;
                    } else if (review.state === 'CHANGES_REQUESTED') {
                        approved = false;
                    }
                });
            }

            if (approved === false) {
                this.log(ProcBot.LogLevel.INFO, `Unable to merge ${owner}/${repo}#${pr.number}, ` +
                    'no approval comment');
                return Promise.resolve();
            }*/

        // Actually generate a new version of a component:
        // 1. Clone the repo
        // 2. Checkout the appropriate branch given the PR number
        // 3. Run `versionist`
        // 4. Read the `CHANGELOG.md` (and any `package.json`, if present)
        // 5. Base64 encode them
        // 6. Call Github to update them, in serial, CHANGELOG last (important for merging expectations)
        // 7. Finish
        this.logger.log(LogLevel.INFO, `PR is ready to merge, attempting to carry out a ` +
            `version up for ${owner}/${repo}#${pr.number}`);
        return this.getConfiguration(owner, repo, ghApiCalls).then((config: VersionBotConfiguration) => {
            botConfig = config;

            // Get the branch for this PR.
            return this.githubCall({
                data: {
                    number: pr.number,
                    owner,
                    repo
                },
                method: ghApiCalls.pullRequests.get
            });
        }).then((prData: GithubApiTypes.PullRequest) => {
            // Get the relevant branch.
            prInfo = prData;
            branchName = prInfo.head.ref;

            // Check to ensure that the PR is actually mergeable. If it isn't, we report this as an
            // error, passing the state.
            if (prInfo.mergeable !== true) {
                throw new Error('The branch cannot currently be merged into master. It has a state of: ' +
                    `\`${prInfo.mergeable_state}\``);
            }

            // Ensure that all the statuses required have passed.
            // If not, an error will be thrown and not proceed any further.
            return this.checkStatuses(prInfo, ghApiCalls);
        }).then((checkStatus) => {
            // Finally we have an array of booleans. If any of them are false,
            // statuses aren't valid.
            if ((checkStatus === StatusChecks.Failed) || (checkStatus === StatusChecks.Pending)) {
                throw new Error('checksPendingOrFailed');
            }

            // Ensure we've not already committed. If we have, we don't wish to do so again.
            return this.getVersionBotCommits(prInfo, ghApiCalls);
        }).then((commitMessage: string | null) => {
            if (commitMessage) {
                throw new Error(`alreadyCommitted`);
            }

            // If this was a labeling action and it's a pull_request event.
            if ((cookedData.data.action === 'labeled') && (cookedData.type === 'pull_request')) {
                this.checkValidMaintainer(botConfig, cookedData.data);
            }

            // Create new work dir.
            return tempMkdir(`${repo}-${pr.number}_`);
        }).then((tempDir: string) => {
            fullPath = `${tempDir}${path.sep}`;

            return this.applyVersionist({
                authToken: cookedData.githubAuthToken,
                branchName,
                fullPath,
                repoFullName
            });
        }).then((versionData: VersionistData) => {
            if (!versionData.version || !versionData.files) {
                throw new Error('Could not find new version!');
            }
            newVersion = versionData.version;

            // Read each file and base64 encode it.
            return Promise.map(versionData.files, (file: string) => {
                return fsReadFile(`${fullPath}${file}`).call(`toString`, 'base64')
                .then((encoding: string) => {
                    let newFile: FileMapping = {
                        file,
                        encoding,
                    };
                    return newFile;
                });
            });
        }).then((files: FileMapping[]) => {
            return this.createCommitBlobs({
                branchName,
                files,
                owner,
                repo,
                version: newVersion
            }, ghApiCalls);
        }).then(() => {
            this.logger.log(LogLevel.INFO, `Upped version of ${repoFullName}#${pr.number} to ` +
                `${newVersion}; tagged and pushed.`);
        }).catch((err: Error) => {
            // Call the VersionBot error specific method if this wasn't the short circuit for
            // committed code.
            if ((err.message !== 'alreadyCommitted') && (err.message !== 'checksPendingOrFailed')) {
                this.reportError({
                    brief: `${process.env.VERSIONBOT_NAME} failed to merge ${repoFullName}#${pr.number}`,
                    githubApiCalls: ghApiCalls,
                    message: `${process.env.VERSIONBOT_NAME} failed to commit a new version to prepare a merge for ` +
                        `the above pull request here: ${pr.html_url}. The reason for this is:\r\n${err.message}\r\n` +
                        'Please carry out relevant changes or alert an appropriate admin.',
                    number: pr.number,
                    owner,
                    repo
                });
            }
        }).finally(tempCleanup);
    }

    // Runs versionist and returns the changed files
    private applyVersionist(versionData: VersionistData): Promise<VersionistData> {
        // Clone the repository inside the directory using the commit name and the run versionist.
        // We only care about output from the git status.
        //
        // IMPORTANT NOTE: Currently, Versionist will fail if it doesn't find a
        //     `package.json` file. This means components that don't have one need a custom
        //     `versionist.conf.js` in their root dir. And we need to test to run against it.
        //     It's possible to get round this using a custom `versionist.conf.js`, which we now support.
        const cliCommand = (command: string) => {
            return exec(command, { cwd: versionData.fullPath });
        };

        return Promise.mapSeries([
            `git clone https://${versionData.authToken}:${versionData.authToken}@github.com/` +
                `${versionData.repoFullName} ${versionData.fullPath}`,
            `git checkout ${versionData.branchName}`
        ], cliCommand).then(() => {
            // Test the repo, we want to see if there's a local `versionist.conf.js`.
            // If so, we use that rather than the built-in default.
            return fsFileExists(`${versionData.fullPath}/versionist.conf.js`)
            .return(true)
            .catch((err: FSError) => {
                if (err.code !== 'ENOENT') {
                    throw err;
                }

                return false;
            });
        }).then((exists: boolean) => {
            let versionistCommand: string;
            return this.getNodeBinPath().then((nodePath: string) => {
                versionistCommand = path.join(nodePath, 'versionist');
                if (exists) {
                    versionistCommand = `${versionistCommand} -c versionist.conf.js`;
                    this.logger.log(LogLevel.INFO, 'Found an overriding versionist config ' +
                        `for ${versionData.repoFullName}, using that`);
                }
            }).then(() => {
                return Promise.mapSeries([
                    versionistCommand,
                    'git status -s'
                ], cliCommand);
            });
        }).get(1).then((status: string) => {
            const moddedFiles: string[] = [];
            let changeLines = status.split('\n');
            let changeLogFound = false;

            if (changeLines.length === 0) {
                throw new Error(`Couldn't find any status changes after running 'versionist', exiting`);
            }
            changeLines = _.slice(changeLines, 0, changeLines.length - 1);
            // For each change, get the name of the change. We shouldn't see *anything* that isn't
            // expected, and we should only see modifications. Log anything else as an issue
            // (but not an error).
            changeLines.forEach((line) => {
                // If we get anything other than an 'M', flag this.
                const match = line.match(/^\sM\s(.+)$/);
                if (!match) {
                    throw new Error(`Found a spurious git status entry: ${line.trim()}, abandoning version up`);
                } else {
                    // Remove the status so we just get a filename.
                    if (match[1] !== 'CHANGELOG.md') {
                        moddedFiles.push(match[1]);
                    } else {
                        changeLogFound = true;
                    }
                }
            });

            // Ensure that the CHANGELOG.md file is always the last and that it exists!
            if (!changeLogFound) {
                throw new Error(`Couldn't find the CHANGELOG.md file, abandoning version up`);
            }
            moddedFiles.push(`CHANGELOG.md`);

            // Now we get the new version from the CHANGELOG (*not* the package.json, it may not exist).
            return exec(`cat ${versionData.fullPath}${_.last(moddedFiles)}`).then((contents: string) => {
                // Only interested in the first match for '## v...'
                const match = contents.match(/^## (v[0-9]+\.[0-9]+\.[0-9]+).+$/m);

                if (!match) {
                    throw new Error('Cannot find new version for ${repoFullName}-#${pr.number}');
                }

                versionData.version = match[1];
                versionData.files = moddedFiles;
            }).return(versionData);
        });
    }

    // Given files, a tree and repo date, commits the new blobs and updates the head of the branch
    private createCommitBlobs(repoData: RepoFileData, githubApi: GithubApi): Promise<void> {
        // We use the Github API to now update every file in our list, ending with the CHANGELOG.md
        // We need this to be the final file updated, as it'll kick off our actual merge.
        //
        // Turn all this into a single method, cleaner.
        // CommitEncodedFile, or something.
        let newTreeSha: string;

        // Get the top level hierarchy for the branch. It includes the files we need.
        return this.githubCall({
            data: {
                owner: repoData.owner,
                repo: repoData.repo,
                sha: repoData.branchName
            },
            method: githubApi.gitdata.getTree
        }).then((treeData: GithubApiTypes.Tree) => {
            // We need to save the tree data, we'll be modifying it for updates in a moment.

            // Create a new blob for our files.
            // Implicit cast.
            return Promise.map(repoData.files, (file: EncodedFile) => {
                // Find the relevant entry in the tree.
                const treeEntry = _.find(treeData.tree, (entry: GithubApiTypes.TreeEntry) => {
                    return entry.path === file.file;
                });

                if (!treeEntry) {
                    throw new Error(`Couldn't find a git tree entry for the file ${file.file}`);
                }

                file.treeEntry = treeEntry;
                return this.githubCall({
                    data: {
                        content: file.encoding,
                        encoding: 'base64',
                        owner: repoData.owner,
                        repo: repoData.repo
                    },
                    method: githubApi.gitdata.createBlob
                }).then((blob: GithubApiTypes.Blob) => {
                    if (file.treeEntry) {
                        file.treeEntry.sha = blob.sha;
                    }
                }).return(file);
            }).then((blobFiles: EncodedFile[]) => {
                // We now have a load of update tree path entries. We write the
                // data back to Github to get a new SHA for it.
                const newTree: GithubApiTypes.TreeEntry[] = [];

                blobFiles.forEach((file: EncodedFile) => {
                    newTree.push({
                        mode: file.treeEntry.mode,
                        path: file.treeEntry.path,
                        sha: file.treeEntry.sha,
                        type: 'blob'
                    });
                });

                // Now write this new tree and get back an SHA for it.
                return this.githubCall({
                    data: {
                        base_tree: treeData.sha,
                        owner: repoData.owner,
                        repo: repoData.repo,
                        tree: newTree
                    },
                    method: githubApi.gitdata.createTree
                });
            }).then((newTree: GithubApiTypes.Tree) => {
                newTreeSha = newTree.sha;

                // Get the last commit for the branch.
                return this.githubCall({
                    data: {
                        owner: repoData.owner,
                        repo: repoData.repo,
                        sha: `${repoData.branchName}`
                    },
                    method: githubApi.repos.getCommit
                });
            }).then((lastCommit: GithubApiTypes.Commit) => {
                // We have new tree object, we now want to create a new commit referencing it.
                return this.githubCall({
                    data: {
                        committer: {
                            email: process.env.VERSIONBOT_EMAIL,
                            name: process.env.VERSIONBOT_NAME
                        },
                        message: `${repoData.version}`,
                        owner: repoData.owner,
                        parents: [ lastCommit.sha ],
                        repo: repoData.repo,
                        tree: newTreeSha
                    },
                    method: githubApi.gitdata.createCommit
                });
            }).then((commit: GithubApiTypes.Commit) => {
                // Finally, we now update the reference to the branch that's changed.
                // This should kick off the change for status.
                return this.githubCall({
                    data: {
                        force: false, // Not that I'm paranoid...
                        owner: repoData.owner,
                        ref: `heads/${repoData.branchName}`,
                        repo: repoData.repo,
                        sha: commit.sha
                    },
                    method: githubApi.gitdata.updateReference
                });
            });
        });
    }

    // Merges the given PR branch to master, given a commit and repo details.
    private mergeToMaster(data: MergeData, githubApiInstance: GithubApi): Promise<void> {
        return this.githubCall({
            data: {
                commit_title: `Auto-merge for PR #${data.prNumber} via ${process.env.VERSIONBOT_NAME}`,
                number: data.prNumber,
                owner: data.owner,
                repo: data.repoName
            },
            method: githubApiInstance.pullRequests.merge
        }).then((mergedData: GithubApiTypes.Merge) => {
            // We get an SHA back when the merge occurs, and we use this for a tag.
            // Note date gets filed in automatically by API.
            return this.githubCall({
                data: {
                    message: data.commitVersion,
                    object: mergedData.sha,
                    owner: data.owner,
                    repo: data.repoName,
                    tag: data.commitVersion,
                    tagger: {
                        email: process.env.VERSIONBOT_EMAIL,
                        name: process.env.VERSIONBOT_NAME
                    },
                    type: 'commit'
                },
                method: githubApiInstance.gitdata.createTag
            });
        }).then((newTag: GithubApiTypes.Tag) => {
            // We now have a SHA back that contains the tag object.
            // Create a new reference based on it.
            return this.githubCall({
                data: {
                    owner: data.owner,
                    ref: `refs/tags/${data.commitVersion}`,
                    repo: data.repoName,
                    sha: newTag.sha
                },
                method: githubApiInstance.gitdata.createReference
            });
        }).then(() => {
            // Delete the merge label. This will ensure future updates to the PR are
            // ignored by us.
            return this.githubCall({
                data: {
                    name: MergeLabel,
                    number: data.prNumber,
                    owner: data.owner,
                    repo: data.repoName
                },
                method: githubApiInstance.issues.removeLabel
            });
        }).then(() => {
            // Get the branch for this PR.
            return this.githubCall({
                data: {
                    number: data.prNumber,
                    owner: data.owner,
                    repo: data.repoName
                },
                method: githubApiInstance.pullRequests.get
            });
        }).then((prInfo: GithubApiTypes.PullRequest) => {
            // Get the relevant branch.
            const branchName = prInfo.head.ref;

            // Finally delete this branch.
            return this.githubCall({
                data: {
                    owner: data.owner,
                    ref: `heads/${branchName}`,
                    repo: data.repoName
                },
                method: githubApiInstance.gitdata.deleteReference
            });
        });
    }

    // Checks the statuses for the given branch (that of a PR).
    // It goes through all the checks and should it find that the
    // last checks for each context have failed, then it will return false
    // else true if all have passed.
    private checkStatuses(prInfo: GithubApiTypes.PullRequest, githubApiInstance: GithubApi): Promise<StatusChecks> {
        // We need to check the branch protection for this repo.
        // Get all the statuses that need to have been satisfied.
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;
        const branch = prInfo.head.ref;
        let protectedContexts: string[] = [];
        const statusLUT: { [key: string]: StatusChecks; } = {
            failure: StatusChecks.Failed,
            pending: StatusChecks.Pending,
            success: StatusChecks.Passed,
        };

        return this.githubCall({
            data: {
                branch: 'master',
                owner,
                repo
            },
            method: githubApiInstance.repos.getProtectedBranchRequiredStatusChecks
        }).then((statusContexts: GithubApiTypes.RequiredStatusChecks) => {
            protectedContexts = statusContexts.contexts;

            // Now get all of the statuses for the master branch.
            return this.githubCall({
                data: {
                    owner,
                    ref: branch,
                    repo
                },
                method: githubApiInstance.repos.getCombinedStatus
            });
        }).then((statuses: GithubApiTypes.CombinedStatus) => {
            // Contexts need to be checked specifically.
            // Branch protection can include contexts that use prefixes which are then
            // suffixed to create more statuses.
            // For example, 'continuous-integration/travis-ci' contexts can end up as:
            //  * continuous-integration/travis-ci/push
            //  * continuous-integration/travis-ci/pr
            // statuses, which mean there are actually two checks per context and not one.
            //
            // The simplest way to check the contexts are therefore to get a list of
            // required status contexts (which we do anyway), then go through each
            // actual status check from the combined, and try and match the prefix of a context
            // with each status. If we get a hit, and the status is a failure, then we
            // have failed. If we match and the status is a pass, we've passed.
            // We can therefore assume that a pass has occurred if:
            //  * We have seen one of every context in the protected status list at least once
            //    AND
            //  * Each of those seen has passed
            // Should any protected context not be seen in the current status checks, then
            // we have failed.
            const statusResults: StatusResult[] = [];
            _.each(protectedContexts, (proContext) => {
                // We go through every status and see if the context prefixes the context
                // of the status.
                _.each(statuses.statuses, (status) => {
                    if (_.startsWith(status.context, proContext)) {
                        // Did the check pass?
                        statusResults.push({
                            name: status.context,
                            state: statusLUT[status.state]
                        });
                    }
                });
            });

            // If any of the checks are pending, we wait.
            if (_.some(statusResults, [ 'state', StatusChecks.Pending ])) {
                return StatusChecks.Pending;
            }

            // If any of the checks didn't pass, we fail.
            if (_.some(statusResults, [ 'state', StatusChecks.Failed ])) {
                this.logger.log(LogLevel.WARN, `Status checks failed: ${JSON.stringify(statusResults)}`);
                return StatusChecks.Failed;
            }

            // Else everything passed.
            return StatusChecks.Passed;
        });
    }

    // Has VersionBot already made commits to the branch.
    private getVersionBotCommits(prInfo: GithubApiTypes.PullRequest, githubApiInstance: GithubApi):
    Promise<string | null> {
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;

        // Get the list of commits for the PR, then get the very last commit SHA.
        return this.githubCall({
            data: {
                owner,
                repo,
                sha: prInfo.head.sha
            },
            method: githubApiInstance.repos.getCommit
        }).then((headCommit: GithubApiTypes.Commit) => {
            const commit = headCommit.commit;
            const files = headCommit.files;

            if ((commit.committer.name === process.env.VERSIONBOT_NAME) &&
            _.find(files, (file: GithubApiTypes.CommitFile) => {
                return file.filename === 'CHANGELOG.md';
            })) {
                return commit.message;
            }

            return null;
        });
    }

    // Actually carry out a merge.
    private finaliseMerge = (data: GithubApiTypes.PullRequestEvent,
    prInfo: GithubApiTypes.PullRequest, githubApiInstance: GithubApi): Promise<void> => {
        // We will go ahead and perform a merge if we see VersionBot has:
        // 1. All of the status checks have passed on the repo
        // 2. VersionBot has committed something with 'CHANGELOG.md' in it
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;

        return this.checkStatuses(prInfo, githubApiInstance).then((checkStatus) => {
            if (checkStatus === StatusChecks.Passed) {
                // Get the list of commits for the PR, then get the very last commit SHA.
                return this.getVersionBotCommits(prInfo, githubApiInstance).then((commitMessage: string | null) => {
                    if (commitMessage) {
                        // Ensure that the labeler was authorised. We do this here, else we could
                        // end up spamming the PR with errors.
                        return this.getConfiguration(owner, repo, githubApiInstance)
                        .then((config: VersionBotConfiguration) => {
                            // If this was a labeling action and there's a config, check to see if there's a maintainers
                            // list and ensure the labeler was on it.
                            // This throws an error if not.
                            if (data.action === 'labeled') {
                                this.checkValidMaintainer(config, data);
                            }

                            // We go ahead and merge.
                            return this.mergeToMaster({
                                commitVersion: commitMessage,
                                owner,
                                prNumber: prInfo.number,
                                repoName: repo
                            }, githubApiInstance);
                        }).then(() => {
                            // No tags here, just mention it in Flowdock so its searchable.
                            // It's not an error so doesn't need logging.
                            if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
                                const flowdockMessage = {
                                    content: `${process.env.VERSIONBOT_NAME} has now merged the above PR, located ` +
                                        `here: ${prInfo.html_url}.`,
                                    from_address: process.env.VERSIONBOT_EMAIL,
                                    roomId: process.env.VERSIONBOT_FLOWDOCK_ROOM,
                                    source: process.env.VERSIONBOT_NAME,
                                    subject: `${process.env.VERSIONBOT_NAME} merged ${owner}/${repo}#${prInfo.number}`
                                };
                                this.flowdockCall(flowdockMessage);
                            }
                            this.logger.log(LogLevel.INFO, `MergePR: Merged ${owner}/${repo}#${prInfo.number}`);
                        }).catch((err: Error) => {
                            // It's possible in some cases that we have to wait for a service that doesn't actually
                            // present itself with status info until it's started. Jenkins is an example of this
                            // which, when queried only responds 'pending' when the build's started.
                            // In these cases, the compulsory status list won't include the particular service,
                            // but the merge will notice that not every status on the branch protection has occurred.
                            // We really don't want to a load of extra calls here, so we instead believe Github and
                            // check for the standard return message and silently ignore it if present.
                            if (!_.startsWith(err.message, 'Required status check')) {
                                throw err;
                            }
                        });
                    }
                });
            }
        });
    }

    private checkValidMaintainer(config: VersionBotConfiguration, event: GithubApiTypes.PullRequestEvent): void {
        // If we have a list of valid maintainers, then we need to ensure that if the `ready-to-merge` label
        // was added, that it was by one of these maintainers.
        const maintainers = (((config || {}).procbot || {}).versionbot || {}).maintainers;
        if (maintainers) {
            // Get the user who added the label.
            if (!_.includes(maintainers, event.sender.login)) {
                let errorMessage = `The \`${MergeLabel}\` label was not added by an authorised ` +
                    'maintainer. Authorised maintainers are:\n';
                _.each(maintainers, (maintainer) => errorMessage = errorMessage.concat(`* @${maintainer}\n`));
                throw new Error(errorMessage);
            }
        }
    }

    private getConfiguration(owner: string, repo: string, githubApiInstance: GithubApi):
    Promise<VersionBotConfiguration | void> {
        const request: ServiceEmitRequest = {
            contexts: {},
            source: process.env.VERSIONBOT_NAME
        };
        request.contexts[this.githubEmitterName] = {
            data: {
                owner,
                repo,
                path: '.procbots.yml'
            },
            method: githubApiInstance.repos.getContent
        };

        // Use the parent method to get the configuration via the GH emitter, but then
        // return it so we can decode it before processing it.
        return this.retrieveConfiguration(this.githubEmitterName, request)
        .then((configRes: ServiceEmitResponse) => {
            // Decode the object.
            if (configRes.err) {
                // Error message is actually JSON.
                const ghError: GithubApiTypes.GithubError = JSON.parse(configRes.err.message);

                // This is because, annoyingly, it's a GH error.
                if (ghError.message === 'Not Found') {
                    return;
                }
            }

            const configData = configRes.response;
            // Github API docs state a blob will *always* be encoded base64...
            if (configData.encoding !== 'base64') {
                this.logger.log(LogLevel.WARN, `A config file exists for ${owner}/${repo} but is not ` +
                    `Base64 encoded! Ignoring.`);
                return;
            }

            return <VersionBotConfiguration>this.processConfiguration(Buffer.from(configData.content, 'base64')
            .toString());
        });
    }

    private reportError(error: VersionBotError): void {
        // We create several reports from this error:
        //  * Flowdock team inbox post in the relevant room
        //  * Comment on the PR affected
        //  * Local console log
        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            const flowdockMessage = {
                content: error.message,
                from_address: process.env.VERSIONBOT_EMAIL,
                roomId: process.env.VERSIONBOT_FLOWDOCK_ROOM,
                source: process.env.VERSIONBOT_NAME,
                subject: error.brief,
                tags: [ 'devops' ]
            };
            this.flowdockCall(flowdockMessage);
        }

        // Post a comment to the relevant PR, also detailing the issue.
        this.githubCall({
            data: {
                body: error.message,
                number: error.number,
                owner: error.owner,
                repo: error.repo
            },
            method: error.githubApiCalls.issues.createComment
        });

        this.logger.alert(AlertLevel.ERROR, error.message);
    }

    // Allows simplified structures to be passed as a Github emitter call.
    // This method fills in the blanks.
    private githubCall(context: GithubEmitRequestContext): Promise<any> {
        const request: ServiceEmitRequest = {
            contexts: {},
            source: process.env.VERSIONBOT_NAME
        };
        request.contexts[this.githubEmitterName] = context;

        return this.dispatchToEmitter(this.githubEmitterName, request).then((data: ServiceEmitResponse) => {
            // On an error, throw.
            if (data.err) {
                // Specifically throw the error message.
                const ghError = JSON.parse(data.err.message);
                throw new Error(ghError.message);
            }

            return data.response;
        });
    }

    private flowdockCall(context: FlowdockEmitRequestContext): Promise<any> {
        const request: ServiceEmitRequest = {
            contexts: {},
            source: process.env.VERSIONBOT_NAME
        };
        request.contexts[this.flowdockEmitterName] = context;

        return this.dispatchToEmitter(this.flowdockEmitterName, request).then((data: ServiceEmitResponse) => {
            if (data.err) {
                throw data.err;
            }

            return data.response;
        });
    }
}

// Export the VersionBot to the app.
// We register the Github events we're interested in here.
export function createBot(): VersionBot {
    if (!(process.env.VERSIONBOT_NAME && process.env.VERSIONBOT_EMAIL && process.env.VERSIONBOT_INTEGRATION_ID &&
    process.env.VERSIONBOT_PEM && process.env.VERSIONBOT_WEBHOOK_SECRET)) {
        throw new Error(`'VERSIONBOT_NAME', 'VERSIONBOT_EMAIL', 'VERSIONBOT_INTEGRATION_ID', 'VERSIONBOT_PEM' and ` +
            `'VERSIONBOT_WEBHOOK_SECRET environment variables need setting`);
    }

    return new VersionBot(process.env.VERSIONBOT_INTEGRATION_ID, process.env.VERSIONBOT_NAME,
    process.env.VERSIONBOT_PEM, process.env.VERSIONBOT_WEBHOOK_SECRET);
}
