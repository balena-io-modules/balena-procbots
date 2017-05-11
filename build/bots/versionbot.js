"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const ChildProcess = require("child_process");
const FS = require("fs");
const _ = require("lodash");
const path = require("path");
const temp_1 = require("temp");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
const exec = Promise.promisify(ChildProcess.exec);
const fsReadFile = Promise.promisify(FS.readFile);
const fsFileExists = Promise.promisify(FS.stat);
const tempMkdir = Promise.promisify(temp_1.track().mkdir);
const tempCleanup = Promise.promisify(temp_1.cleanup);
;
var StatusChecks;
(function (StatusChecks) {
    StatusChecks[StatusChecks["Passed"] = 0] = "Passed";
    StatusChecks[StatusChecks["Pending"] = 1] = "Pending";
    StatusChecks[StatusChecks["Failed"] = 2] = "Failed";
})(StatusChecks || (StatusChecks = {}));
;
const MergeLabel = 'procbots/versionbot/ready-to-merge';
const IgnoreLabel = 'procbots/versionbot/no-checks';
class VersionBot extends procbot_1.ProcBot {
    constructor(integration, name, pemString, webhook) {
        super(name);
        this.statusChange = (registration, event) => {
            const splitRepo = event.cookedEvent.data.name.split('/');
            const owner = splitRepo[0];
            const repo = splitRepo[1];
            const commitSha = event.cookedEvent.data.sha;
            const branches = event.cookedEvent.data.branches;
            if (!event.cookedEvent.githubApi) {
                throw new Error('No Github API instance found');
            }
            const ghApiCalls = event.cookedEvent.githubApi;
            if (event.cookedEvent.data.context === 'Versionist') {
                return Promise.resolve();
            }
            return Promise.map(branches, (branch) => {
                return this.githubCall({
                    data: {
                        head: `${owner}:${branch.name}`,
                        owner,
                        repo,
                        state: 'open'
                    },
                    method: ghApiCalls.pullRequests.getAll
                });
            }).then((prs) => {
                let prEvents = [];
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
                return Promise.map(prEvents, (prEvent) => {
                    return this.checkVersioning(registration, prEvent);
                });
            });
        };
        this.checkVersioning = (_registration, event) => {
            const pr = event.cookedEvent.data.pull_request;
            const head = event.cookedEvent.data.pull_request.head;
            const owner = head.repo.owner.login;
            const name = head.repo.name;
            if (!event.cookedEvent.githubApi) {
                throw new Error('No Github API instance found');
            }
            const ghApiCalls = event.cookedEvent.githubApi;
            if ((event.cookedEvent.data.action !== 'opened') && (event.cookedEvent.data.action !== 'synchronize') &&
                (event.cookedEvent.data.action !== 'labeled')) {
                return Promise.resolve();
            }
            this.logger.log(logger_1.LogLevel.INFO, `Checking version for ${owner}/${name}#${pr.number}`);
            return this.githubCall({
                data: {
                    owner,
                    number: pr.number,
                    repo: name,
                },
                method: ghApiCalls.pullRequests.getCommits
            }).then((commits) => {
                let changetypeFound = false;
                for (let commit of commits) {
                    const commitMessage = commit.commit.message;
                    const lines = commitMessage.split('\n');
                    const lastLine = _.findLastIndex(lines, (line) => line.match(/^\s*$/));
                    if (lastLine > 0) {
                        lines.splice(0, lastLine);
                        const footer = lines.join('\n');
                        const invalidCommit = !footer.match(/^change-type:\s*(patch|minor|major)\s*$/mi);
                        if (!invalidCommit) {
                            changetypeFound = true;
                            break;
                        }
                    }
                }
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
                this.logger.log(logger_1.LogLevel.INFO, "No valid 'Change-Type' tag found, failing last commit " +
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
                return this.githubCall({
                    data: {
                        number: pr.number,
                        owner,
                        repo: name
                    },
                    method: ghApiCalls.issues.getIssueLabels
                });
            }).then((labels) => {
                if (_.some(labels, (label) => label.name === MergeLabel)) {
                    return this.githubCall({
                        data: {
                            number: pr.number,
                            owner,
                            repo: name
                        },
                        method: ghApiCalls.pullRequests.get
                    }).then((mergePr) => {
                        if (mergePr.state === 'open') {
                            return this.finaliseMerge(event.cookedEvent.data, mergePr, ghApiCalls);
                        }
                    });
                }
            }).catch((err) => {
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
        };
        this.mergePR = (_registration, event) => {
            const cookedData = event.cookedEvent;
            const data = cookedData.data;
            const pr = data.pull_request;
            const head = data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            const repoFullName = `${owner}/${repo}`;
            let newVersion;
            let fullPath;
            let branchName;
            let prInfo;
            let botConfig;
            if (!event.cookedEvent.githubApi) {
                throw new Error('No Github API instance found');
            }
            const ghApiCalls = event.cookedEvent.githubApi;
            switch (cookedData.data.action) {
                case 'submitted':
                case 'labeled':
                    break;
                default:
                    return Promise.resolve();
            }
            this.logger.log(logger_1.LogLevel.INFO, `Attempting merge for ${owner}/${repo}#${pr.number}`);
            this.logger.log(logger_1.LogLevel.INFO, `PR is ready to merge, attempting to carry out a ` +
                `version up for ${owner}/${repo}#${pr.number}`);
            return this.getConfiguration(owner, repo, ghApiCalls).then((config) => {
                botConfig = config;
                return this.githubCall({
                    data: {
                        number: pr.number,
                        owner,
                        repo
                    },
                    method: ghApiCalls.pullRequests.get
                });
            }).then((prData) => {
                prInfo = prData;
                branchName = prInfo.head.ref;
                if (prInfo.mergeable !== true) {
                    throw new Error('The branch cannot currently be merged into master. It has a state of: ' +
                        `\`${prInfo.mergeable_state}\``);
                }
                return this.checkStatuses(prInfo, ghApiCalls);
            }).then((checkStatus) => {
                if ((checkStatus === StatusChecks.Failed) || (checkStatus === StatusChecks.Pending)) {
                    throw new Error('checksPendingOrFailed');
                }
                return this.getVersionBotCommits(prInfo, ghApiCalls);
            }).then((commitMessage) => {
                if (commitMessage) {
                    throw new Error(`alreadyCommitted`);
                }
                if ((cookedData.data.action === 'labeled') && (cookedData.type === 'pull_request')) {
                    this.checkValidMaintainer(botConfig, cookedData.data);
                }
                return tempMkdir(`${repo}-${pr.number}_`);
            }).then((tempDir) => {
                fullPath = `${tempDir}${path.sep}`;
                return this.applyVersionist({
                    authToken: cookedData.githubAuthToken,
                    branchName,
                    fullPath,
                    repoFullName
                });
            }).then((versionData) => {
                if (!versionData.version || !versionData.files) {
                    throw new Error('Could not find new version!');
                }
                newVersion = versionData.version;
                return Promise.map(versionData.files, (file) => {
                    return fsReadFile(`${fullPath}${file}`).call(`toString`, 'base64')
                        .then((encoding) => {
                        let newFile = {
                            file,
                            encoding,
                        };
                        return newFile;
                    });
                });
            }).then((files) => {
                return this.createCommitBlobs({
                    branchName,
                    files,
                    owner,
                    repo,
                    version: newVersion
                }, ghApiCalls);
            }).then(() => {
                this.logger.log(logger_1.LogLevel.INFO, `Upped version of ${repoFullName}#${pr.number} to ` +
                    `${newVersion}; tagged and pushed.`);
            }).catch((err) => {
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
        };
        this.finaliseMerge = (data, prInfo, githubApiInstance) => {
            const owner = prInfo.head.repo.owner.login;
            const repo = prInfo.head.repo.name;
            return this.checkStatuses(prInfo, githubApiInstance).then((checkStatus) => {
                if (checkStatus === StatusChecks.Passed) {
                    return this.getVersionBotCommits(prInfo, githubApiInstance).then((commitMessage) => {
                        if (commitMessage) {
                            return this.getConfiguration(owner, repo, githubApiInstance)
                                .then((config) => {
                                if (data.action === 'labeled') {
                                    this.checkValidMaintainer(config, data);
                                }
                                return this.mergeToMaster({
                                    commitVersion: commitMessage,
                                    owner,
                                    prNumber: prInfo.number,
                                    repoName: repo
                                }, githubApiInstance);
                            }).then(() => {
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
                                this.logger.log(logger_1.LogLevel.INFO, `MergePR: Merged ${owner}/${repo}#${prInfo.number}`);
                            }).catch((err) => {
                                if (!_.startsWith(err.message, 'Required status check')) {
                                    throw err;
                                }
                            });
                        }
                    });
                }
            });
        };
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
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            pem: pemString,
            type: 'emitter'
        });
        if (!ghListener) {
            throw new Error("Couldn't create a Github listener");
        }
        if (!ghEmitter) {
            throw new Error("Couldn't create a Github emitter");
        }
        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;
        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            const fdEmitter = this.addServiceEmitter('flowdock');
            if (!fdEmitter) {
                throw new Error("Couldn't create a Flowdock emitter");
            }
            this.flowdockEmitterName = fdEmitter.serviceName;
        }
        _.forEach([
            {
                events: ['pull_request'],
                listenerMethod: this.checkVersioning,
                name: 'CheckVersionistCommitStatus',
                suppressionLabels: [IgnoreLabel]
            },
            {
                events: ['pull_request', 'pull_request_review'],
                listenerMethod: this.mergePR,
                name: 'CheckForReadyMergeState',
                suppressionLabels: [IgnoreLabel],
                triggerLabels: [MergeLabel]
            },
            {
                events: ['status'],
                listenerMethod: this.statusChange,
                name: 'StatusChangeState',
                suppressionLabels: [IgnoreLabel],
                triggerLabels: [MergeLabel]
            }
        ], (reg) => {
            ghListener.registerEvent(reg);
        });
    }
    applyVersionist(versionData) {
        const cliCommand = (command) => {
            return exec(command, { cwd: versionData.fullPath });
        };
        return Promise.mapSeries([
            `git clone https://${versionData.authToken}:${versionData.authToken}@github.com/` +
                `${versionData.repoFullName} ${versionData.fullPath}`,
            `git checkout ${versionData.branchName}`
        ], cliCommand).then(() => {
            return fsFileExists(`${versionData.fullPath}/versionist.conf.js`)
                .return(true)
                .catch((err) => {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
                return false;
            });
        }).then((exists) => {
            let versionistCommand;
            return this.getNodeBinPath().then((nodePath) => {
                versionistCommand = path.join(nodePath, 'versionist');
                if (exists) {
                    versionistCommand = `${versionistCommand} -c versionist.conf.js`;
                    this.logger.log(logger_1.LogLevel.INFO, 'Found an overriding versionist config ' +
                        `for ${versionData.repoFullName}, using that`);
                }
            }).then(() => {
                return Promise.mapSeries([
                    versionistCommand,
                    'git status -s'
                ], cliCommand);
            });
        }).get(1).then((status) => {
            const moddedFiles = [];
            let changeLines = status.split('\n');
            let changeLogFound = false;
            if (changeLines.length === 0) {
                throw new Error(`Couldn't find any status changes after running 'versionist', exiting`);
            }
            changeLines = _.slice(changeLines, 0, changeLines.length - 1);
            changeLines.forEach((line) => {
                const match = line.match(/^\sM\s(.+)$/);
                if (!match) {
                    throw new Error(`Found a spurious git status entry: ${line.trim()}, abandoning version up`);
                }
                else {
                    if (match[1] !== 'CHANGELOG.md') {
                        moddedFiles.push(match[1]);
                    }
                    else {
                        changeLogFound = true;
                    }
                }
            });
            if (!changeLogFound) {
                throw new Error(`Couldn't find the CHANGELOG.md file, abandoning version up`);
            }
            moddedFiles.push(`CHANGELOG.md`);
            return exec(`cat ${versionData.fullPath}${_.last(moddedFiles)}`).then((contents) => {
                const match = contents.match(/^## (v[0-9]+\.[0-9]+\.[0-9]+).+$/m);
                if (!match) {
                    throw new Error('Cannot find new version for ${repoFullName}-#${pr.number}');
                }
                versionData.version = match[1];
                versionData.files = moddedFiles;
            }).return(versionData);
        });
    }
    createCommitBlobs(repoData, githubApi) {
        let newTreeSha;
        return this.githubCall({
            data: {
                owner: repoData.owner,
                repo: repoData.repo,
                sha: repoData.branchName
            },
            method: githubApi.gitdata.getTree
        }).then((treeData) => {
            return Promise.map(repoData.files, (file) => {
                const treeEntry = _.find(treeData.tree, (entry) => {
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
                }).then((blob) => {
                    if (file.treeEntry) {
                        file.treeEntry.sha = blob.sha;
                    }
                }).return(file);
            }).then((blobFiles) => {
                const newTree = [];
                blobFiles.forEach((file) => {
                    newTree.push({
                        mode: file.treeEntry.mode,
                        path: file.treeEntry.path,
                        sha: file.treeEntry.sha,
                        type: 'blob'
                    });
                });
                return this.githubCall({
                    data: {
                        base_tree: treeData.sha,
                        owner: repoData.owner,
                        repo: repoData.repo,
                        tree: newTree
                    },
                    method: githubApi.gitdata.createTree
                });
            }).then((newTree) => {
                newTreeSha = newTree.sha;
                return this.githubCall({
                    data: {
                        owner: repoData.owner,
                        repo: repoData.repo,
                        sha: `${repoData.branchName}`
                    },
                    method: githubApi.repos.getCommit
                });
            }).then((lastCommit) => {
                return this.githubCall({
                    data: {
                        committer: {
                            email: process.env.VERSIONBOT_EMAIL,
                            name: process.env.VERSIONBOT_NAME
                        },
                        message: `${repoData.version}`,
                        owner: repoData.owner,
                        parents: [lastCommit.sha],
                        repo: repoData.repo,
                        tree: newTreeSha
                    },
                    method: githubApi.gitdata.createCommit
                });
            }).then((commit) => {
                return this.githubCall({
                    data: {
                        force: false,
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
    mergeToMaster(data, githubApiInstance) {
        return this.githubCall({
            data: {
                commit_title: `Auto-merge for PR #${data.prNumber} via ${process.env.VERSIONBOT_NAME}`,
                number: data.prNumber,
                owner: data.owner,
                repo: data.repoName
            },
            method: githubApiInstance.pullRequests.merge
        }).then((mergedData) => {
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
        }).then((newTag) => {
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
            return this.githubCall({
                data: {
                    number: data.prNumber,
                    owner: data.owner,
                    repo: data.repoName
                },
                method: githubApiInstance.pullRequests.get
            });
        }).then((prInfo) => {
            const branchName = prInfo.head.ref;
            return this.githubCall({
                data: {
                    owner: data.owner,
                    ref: `heads/${branchName}`,
                    repo: data.repoName
                },
                method: githubApiInstance.gitdata.deleteReference
            });
        }).catch((err) => {
            if (err.message !== 'Pull Request is not mergeable') {
                throw err;
            }
            return this.githubCall({
                data: {
                    number: data.prNumber,
                    owner: data.owner,
                    repo: data.repoName
                },
                method: githubApiInstance.pullRequests.get
            }).then((mergePr) => {
                if (mergePr.state === 'open') {
                    throw err;
                }
            });
        });
    }
    checkStatuses(prInfo, githubApiInstance) {
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;
        const branch = prInfo.head.ref;
        let protectedContexts = [];
        const statusLUT = {
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
        }).then((statusContexts) => {
            protectedContexts = statusContexts.contexts;
            return this.githubCall({
                data: {
                    owner,
                    ref: branch,
                    repo
                },
                method: githubApiInstance.repos.getCombinedStatus
            });
        }).then((statuses) => {
            const statusResults = [];
            _.each(protectedContexts, (proContext) => {
                _.each(statuses.statuses, (status) => {
                    if (_.startsWith(status.context, proContext)) {
                        statusResults.push({
                            name: status.context,
                            state: statusLUT[status.state]
                        });
                    }
                });
            });
            if (_.some(statusResults, ['state', StatusChecks.Pending])) {
                return StatusChecks.Pending;
            }
            if (_.some(statusResults, ['state', StatusChecks.Failed])) {
                this.logger.log(logger_1.LogLevel.WARN, `Status checks failed: ${JSON.stringify(statusResults)}`);
                return StatusChecks.Failed;
            }
            return StatusChecks.Passed;
        });
    }
    getVersionBotCommits(prInfo, githubApiInstance) {
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;
        return this.githubCall({
            data: {
                owner,
                repo,
                sha: prInfo.head.sha
            },
            method: githubApiInstance.repos.getCommit
        }).then((headCommit) => {
            const commit = headCommit.commit;
            const files = headCommit.files;
            if ((commit.committer.name === process.env.VERSIONBOT_NAME) &&
                _.find(files, (file) => {
                    return file.filename === 'CHANGELOG.md';
                })) {
                return commit.message;
            }
            return null;
        });
    }
    checkValidMaintainer(config, event) {
        const maintainers = (((config || {}).procbot || {}).versionbot || {}).maintainers;
        if (maintainers) {
            if (!_.includes(maintainers, event.sender.login)) {
                let errorMessage = `The \`${MergeLabel}\` label was not added by an authorised ` +
                    'maintainer. Authorised maintainers are:\n';
                _.each(maintainers, (maintainer) => errorMessage = errorMessage.concat(`* @${maintainer}\n`));
                throw new Error(errorMessage);
            }
        }
    }
    getConfiguration(owner, repo, githubApiInstance) {
        const request = {
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
        return this.retrieveConfiguration(this.githubEmitterName, request)
            .then((configRes) => {
            if (configRes.err) {
                const ghError = JSON.parse(configRes.err.message);
                if (ghError.message === 'Not Found') {
                    return;
                }
            }
            const configData = configRes.response;
            if (configData.encoding !== 'base64') {
                this.logger.log(logger_1.LogLevel.WARN, `A config file exists for ${owner}/${repo} but is not ` +
                    `Base64 encoded! Ignoring.`);
                return;
            }
            return this.processConfiguration(Buffer.from(configData.content, 'base64')
                .toString());
        });
    }
    reportError(error) {
        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            const flowdockMessage = {
                content: error.message,
                from_address: process.env.VERSIONBOT_EMAIL,
                roomId: process.env.VERSIONBOT_FLOWDOCK_ROOM,
                source: process.env.VERSIONBOT_NAME,
                subject: error.brief,
                tags: ['devops']
            };
            this.flowdockCall(flowdockMessage);
        }
        this.githubCall({
            data: {
                body: error.message,
                number: error.number,
                owner: error.owner,
                repo: error.repo
            },
            method: error.githubApiCalls.issues.createComment
        });
        this.logger.alert(logger_1.AlertLevel.ERROR, error.message);
    }
    githubCall(context) {
        const request = {
            contexts: {},
            source: process.env.VERSIONBOT_NAME
        };
        request.contexts[this.githubEmitterName] = context;
        return this.dispatchToEmitter(this.githubEmitterName, request).then((data) => {
            if (data.err) {
                const ghError = JSON.parse(data.err.message);
                throw new Error(ghError.message);
            }
            return data.response;
        });
    }
    flowdockCall(context) {
        const request = {
            contexts: {},
            source: process.env.VERSIONBOT_NAME
        };
        request.contexts[this.flowdockEmitterName] = context;
        return this.dispatchToEmitter(this.flowdockEmitterName, request).then((data) => {
            if (data.err) {
                throw data.err;
            }
            return data.response;
        });
    }
}
exports.VersionBot = VersionBot;
function createBot() {
    if (!(process.env.VERSIONBOT_NAME && process.env.VERSIONBOT_EMAIL && process.env.VERSIONBOT_INTEGRATION_ID &&
        process.env.VERSIONBOT_PEM && process.env.VERSIONBOT_WEBHOOK_SECRET)) {
        throw new Error(`'VERSIONBOT_NAME', 'VERSIONBOT_EMAIL', 'VERSIONBOT_INTEGRATION_ID', 'VERSIONBOT_PEM' and ` +
            `'VERSIONBOT_WEBHOOK_SECRET environment variables need setting`);
    }
    return new VersionBot(process.env.VERSIONBOT_INTEGRATION_ID, process.env.VERSIONBOT_NAME, process.env.VERSIONBOT_PEM, process.env.VERSIONBOT_WEBHOOK_SECRET);
}
exports.createBot = createBot;

//# sourceMappingURL=versionbot.js.map
