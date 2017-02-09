"use strict";
const Promise = require("bluebird");
const ChildProcess = require("child_process");
const FS = require("fs");
const _ = require("lodash");
const path = require("path");
const temp_1 = require("temp");
const flowdock_1 = require("../adapters/flowdock");
const GithubBot = require("./githubbot");
const ProcBot = require("./procbot");
const exec = Promise.promisify(ChildProcess.exec);
const fsReadFile = Promise.promisify(FS.readFile);
const tempMkdir = Promise.promisify(temp_1.mkdir);
const tempCleanup = Promise.promisify(temp_1.track);
;
class VersionBot extends GithubBot.GithubBot {
    constructor(integration, name) {
        super(integration, name);
        this.checkVersioning = (action, data) => {
            const githubApi = this.githubApi;
            const pr = data.pull_request;
            const head = data.pull_request.head;
            const owner = head.repo.owner.login;
            const name = head.repo.name;
            this.log(ProcBot.LogLevel.DEBUG, `${action.name}: entered`);
            if ((data.action !== 'opened') && (data.action !== 'synchronize') &&
                (data.action !== 'labeled')) {
                return Promise.resolve();
            }
            return this.gitCall(githubApi.pullRequests.getCommits, {
                owner,
                number: pr.number,
                repo: name,
            }).then((commits) => {
                let changetypeFound = false;
                for (let commit of commits) {
                    const commitMessage = commit.commit.message;
                    const invalidCommit = !commitMessage.match(/^change-type:\s*(patch|minor|major)\s*$/mi);
                    if (!invalidCommit) {
                        changetypeFound = true;
                        break;
                    }
                }
                if (changetypeFound) {
                    return this.gitCall(githubApi.repos.createStatus, {
                        context: 'Versionist',
                        description: 'Found a valid Versionist `Change-Type` tag',
                        owner,
                        repo: name,
                        sha: head.sha,
                        state: 'success'
                    }).return(true);
                }
                this.log(ProcBot.LogLevel.DEBUG, `${action.name}: No valid 'Change-Type' tag found, failing last commit`);
                return Promise.all([
                    this.gitCall(githubApi.repos.createStatus, {
                        context: 'Versionist',
                        description: 'None of the commits in the PR have a `Change-Type` tag',
                        owner,
                        repo: name,
                        sha: head.sha,
                        state: 'failure'
                    }),
                    this.gitCall(githubApi.issues.createComment, {
                        body: `@${data.sender.login}, please ensure that at least one commit contains a` +
                            '`Change-Type:` tag.',
                        owner,
                        number: pr.number,
                        repo: name,
                    })
                ]).return(false);
            }).then(() => {
                return this.gitCall(githubApi.repos.getCommit, {
                    owner,
                    repo: name,
                    sha: head.sha
                });
            }).then((headCommit) => {
                const commit = headCommit.commit;
                const files = headCommit.files;
                if ((commit.committer.name === process.env.VERSIONBOT_NAME) &&
                    _.find(files, (file) => {
                        return file.filename === 'CHANGELOG.md';
                    })) {
                    return this.mergeToMaster({
                        commitVersion: commit.message,
                        owner,
                        prNumber: pr.number,
                        repoName: name
                    }).then(() => {
                        const flowdockMessage = {
                            content: 'VersionBot has now merged the above PR, located here:' +
                                `${pr.html_url}.`,
                            from_address: process.env.VERSIONBOT_EMAIL,
                            roomId: process.env.VERSIONBOT_FLOWDOCK_ROOM,
                            source: process.env.VERSIONBOT_NAME,
                            subject: `VersionBot merged ${owner}/${name}#${pr.number}`
                        };
                        if (process.env.VERSIONBOT_FLOWDOCK_ADAPTER) {
                            this.flowdock.postToInbox(flowdockMessage);
                        }
                    });
                }
            }).catch((err) => {
                this.reportError({
                    brief: `Versionbot check failed for ${owner}/${name}#${pr.number}`,
                    message: 'Versionbot failed to carry out a status check for the above pull request ' +
                        `here: ${pr.html_url}. The reason for this is:\r\n${err.message}\r\n` +
                        'Please alert an appropriate admin.',
                    owner,
                    number: pr.number,
                    repo: name
                });
            });
        };
        this.mergePR = (action, data) => {
            const githubApi = this.githubApi;
            const pr = data.pull_request;
            const head = data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            const repoFullName = `${owner}/${repo}`;
            let newVersion;
            let fullPath;
            let branchName;
            this.log(ProcBot.LogLevel.DEBUG, `${action.name}: entered`);
            switch (data.action) {
                case 'submitted':
                case 'labeled':
                case 'unlabeled':
                    break;
                default:
                    this.log(ProcBot.LogLevel.INFO, `${action.name}:${data.action} isn't a useful action`);
                    return Promise.resolve();
            }
            return this.gitCall(githubApi.pullRequests.getReviews, {
                number: pr.number,
                owner,
                repo
            }).then((reviews) => {
                let approved = false;
                if (reviews) {
                    reviews.forEach((review) => {
                        if (review.state === 'APPROVED') {
                            approved = true;
                        }
                        else if (review.state === 'CHANGES_REQUESTED') {
                            approved = false;
                        }
                    });
                }
                if (approved === false) {
                    this.log(ProcBot.LogLevel.INFO, `Unable to merge, no approval comment`);
                    return Promise.resolve();
                }
                this.log(ProcBot.LogLevel.INFO, 'PR is ready to merge, attempting to carry out a version up');
                return this.gitCall(githubApi.pullRequests.get, {
                    number: pr.number,
                    owner,
                    repo
                }).then((prInfo) => {
                    branchName = prInfo.head.ref;
                    return tempMkdir(`${repo}-${pr.number}_`);
                }).then((tempDir) => {
                    fullPath = `${tempDir}${path.sep}`;
                    return this.applyVersionist({
                        fullPath,
                        branchName,
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
                        owner,
                        repo,
                        branchName,
                        version: newVersion,
                        files
                    });
                }).then(() => {
                    return tempCleanup();
                }).then(() => {
                    this.log(ProcBot.LogLevel.INFO, `Upped version of ${repoFullName} to ${newVersion}; ` +
                        `tagged and pushed.`);
                }).catch((err) => {
                    this.reportError({
                        brief: `Versionbot failed to create a new version ready for merge for ${repoFullName}#${pr.number}`,
                        message: 'Versionbot failed to commit a new version to prepare a merge for the above pull ' +
                            `request here: ${pr.html_url}. The reason for this is:\r\n${err.message}\r\n` +
                            'Please alert an appropriate admin.',
                        owner,
                        number: pr.number,
                        repo
                    });
                });
            });
        };
        _.forEach([
            {
                events: ['pull_request'],
                name: 'CheckVersionistCommitStatus',
                suppressionLabels: ['procbots/versionbot/no-checks'],
                workerMethod: this.checkVersioning
            },
            {
                events: ['pull_request', 'pull_request_review'],
                name: 'CheckForReadyMergeState',
                suppressionLabels: ['procbots/versionbot/no-checks'],
                triggerLabels: ['procbots/versionbot/ready-to-merge'],
                workerMethod: this.mergePR,
            }
        ], (reg) => {
            this.registerAction(reg);
        });
        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            this.flowdock = new flowdock_1.FlowdockAdapter();
        }
        this.authenticate();
    }
    applyVersionist(versionData) {
        return Promise.mapSeries([
            `git clone https://${process.env.WEBHOOK_SECRET}:x-oauth-basic@github.com/${versionData.repoFullName} ` +
                `${versionData.fullPath}`,
            `git checkout ${versionData.branchName}`,
            'versionist',
            'git status -s'
        ], (command) => {
            return exec(command, { cwd: versionData.fullPath });
        }).get(3).then((status) => {
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
    createCommitBlobs(repoData) {
        const githubApi = this.githubApi;
        let newTreeSha;
        return this.gitCall(githubApi.gitdata.getTree, {
            owner: repoData.owner,
            repo: repoData.repo,
            sha: repoData.branchName
        }).then((treeData) => {
            return Promise.map(repoData.files, (file) => {
                const treeEntry = _.find(treeData.tree, (entry) => {
                    return entry.path === file.file;
                });
                if (!treeEntry) {
                    throw new Error(`Couldn't find a git tree entry for the file ${file.file}`);
                }
                file.treeEntry = treeEntry;
                return this.gitCall(githubApi.gitdata.createBlob, {
                    content: file.encoding,
                    encoding: 'base64',
                    owner: repoData.owner,
                    repo: repoData.repo
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
                return this.gitCall(githubApi.gitdata.createTree, {
                    base_tree: treeData.sha,
                    owner: repoData.owner,
                    repo: repoData.repo,
                    tree: newTree
                });
            }).then((newTree) => {
                newTreeSha = newTree.sha;
                return this.gitCall(githubApi.repos.getCommit, {
                    owner: repoData.owner,
                    repo: repoData.repo,
                    sha: `${repoData.branchName}`
                });
            }).then((lastCommit) => {
                return this.gitCall(githubApi.gitdata.createCommit, {
                    committer: {
                        email: 'versionbot@whaleway.net',
                        name: 'Versionbot'
                    },
                    message: `${repoData.version}`,
                    owner: repoData.owner,
                    parents: [lastCommit.sha],
                    repo: repoData.repo,
                    tree: newTreeSha
                });
            }).then((commit) => {
                return this.gitCall(githubApi.gitdata.updateReference, {
                    force: false,
                    owner: repoData.owner,
                    ref: `heads/${repoData.branchName}`,
                    repo: repoData.repo,
                    sha: commit.sha
                });
            });
        });
    }
    mergeToMaster(data) {
        const githubApi = this.githubApi;
        return this.gitCall(githubApi.pullRequests.merge, {
            commit_title: `Auto-merge for PR ${data.prNumber} via Versionbot`,
            number: data.prNumber,
            owner: data.owner,
            repo: data.repoName
        }, 3).then((mergedData) => {
            return this.gitCall(githubApi.gitdata.createTag, {
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
            });
        }).then((newTag) => {
            return this.gitCall(githubApi.gitdata.createReference, {
                owner: data.owner,
                ref: `refs/tags/${data.commitVersion}`,
                repo: data.repoName,
                sha: newTag.sha
            });
        }).then(() => {
            return this.gitCall(githubApi.pullRequests.get, {
                number: data.prNumber,
                owner: data.owner,
                repo: data.repoName
            });
        }).then((prInfo) => {
            const branchName = prInfo.head.ref;
            return this.gitCall(githubApi.gitdata.deleteReference, {
                owner: data.owner,
                ref: `heads/${branchName}`,
                repo: data.repoName
            });
        });
    }
    reportError(error) {
        const githubApi = this.githubApi;
        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            const flowdockMessage = {
                content: error.message,
                from_address: process.env.VERSIONBOT_EMAIL,
                roomId: process.env.VERSIONBOT_FLOWDOCK_ROOM,
                source: process.env.VERSIONBOT_NAME,
                subject: error.brief,
                tags: ['devops']
            };
            this.flowdock.postToInbox(flowdockMessage);
        }
        this.gitCall(githubApi.issues.createComment, {
            body: error.message,
            number: error.number,
            owner: error.owner,
            repo: error.repo
        });
        this.alert(ProcBot.AlertLevel.ERROR, error.message);
    }
}
exports.VersionBot = VersionBot;
function createBot() {
    if (!(process.env.VERSIONBOT_NAME && process.env.VERSIONBOT_EMAIL)) {
        throw new Error(`'VERSIONBOT_NAME' and 'VERSIONBOT_EMAIL' environment variables need setting`);
    }
    return new VersionBot(process.env.INTEGRATION_ID, process.env.VERSIONBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=versionbot.js.map
