"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const FS = require("fs");
const _ = require("lodash");
const path = require("path");
const temp_1 = require("temp");
const procbot_1 = require("../framework/procbot");
const environment_1 = require("../utils/environment");
const logger_1 = require("../utils/logger");
const fsReadFile = Promise.promisify(FS.readFile);
const fsFileExists = Promise.promisify(FS.stat);
const tempMkdir = Promise.promisify(temp_1.track().mkdir);
const tempCleanup = Promise.promisify(temp_1.cleanup);
;
var ReviewState;
(function (ReviewState) {
    ReviewState[ReviewState["Approved"] = 0] = "Approved";
    ReviewState[ReviewState["ChangesRequired"] = 1] = "ChangesRequired";
})(ReviewState || (ReviewState = {}));
;
;
const RepositoryFilePath = 'repository.yml';
const ReviewerAddMessage = 'Please add yourselves as reviewers for this PR.';
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
    constructor(integration, name, email, pemString, webhook) {
        super(name);
        this.statusChange = (registration, event) => {
            const splitRepo = event.cookedEvent.data.name.split('/');
            const owner = splitRepo[0];
            const repo = splitRepo[1];
            const commitSha = event.cookedEvent.data.sha;
            const branches = event.cookedEvent.data.branches;
            let prEvents = [];
            if (event.cookedEvent.data.context === 'Versionist') {
                return Promise.resolve();
            }
            return Promise.map(branches, (branch) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        head: `${owner}:${branch.name}`,
                        owner,
                        repo,
                        state: 'open'
                    },
                    method: this.githubApi.pullRequests.getAll
                });
            }).then((foundPrs) => {
                const prs = _.flatten(foundPrs);
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
                return Promise.delay(2000).then(() => {
                    return Promise.filter(prEvents, (prEvent) => {
                        const pr = prEvent.cookedEvent.data.pull_request;
                        return this.dispatchToEmitter(this.githubEmitterName, {
                            data: {
                                number: pr.number,
                                owner: pr.head.repo.owner.login,
                                repo: pr.head.repo.name,
                            },
                            method: this.githubApi.issues.getIssueLabels
                        }).then((labels) => {
                            if (!_.every(labels, (label) => label.name !== IgnoreLabel)) {
                                this.logger.log(logger_1.LogLevel.DEBUG, `Dropping '${registration.name}' as suppression labels are all present`);
                                return false;
                            }
                            return true;
                        });
                    });
                });
            }).map((prEvent) => {
                return this.checkFooterTags(registration, prEvent);
            });
        };
        this.checkWaffleFlow = (_registration, event) => {
            const pr = event.cookedEvent.data.pull_request;
            const head = event.cookedEvent.data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            const prNumber = pr.number;
            const issues = [];
            const waffleString = '---- Autogenerated Waffleboard Connection: Connects to #';
            let body = pr.body;
            const generateWaffleReference = (text) => {
                const regExp = /connects-to:\s+#([0-9]+)/gi;
                let match = regExp.exec(text);
                while (match) {
                    const issueNumber = match[1];
                    if (issues.indexOf(issueNumber) === -1) {
                        issues.push(issueNumber);
                    }
                    match = regExp.exec(text);
                }
            };
            this.logger.log(logger_1.LogLevel.INFO, `Checking ${owner}/${repo}#${prNumber} for potential Waffleboard connection ` +
                'comments');
            generateWaffleReference(pr.body);
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    number: prNumber,
                    owner,
                    repo,
                },
                method: this.githubApi.pullRequests.getCommits
            }).then((commits) => {
                for (let commit of commits) {
                    generateWaffleReference(commit.commit.message);
                }
                _.each(issues, (issue) => {
                    if (body.indexOf(`${waffleString}${issue}`) === -1) {
                        let nlChar = '';
                        if (body.charAt(body.length - 1) !== '\n') {
                            nlChar = '\n';
                        }
                        body += `${nlChar}${waffleString}${issue}`;
                    }
                });
                if (body !== pr.body) {
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            body,
                            number: prNumber,
                            owner,
                            repo,
                        },
                        method: this.githubApi.pullRequests.update
                    });
                }
            });
        };
        this.addReviewers = (_registration, event) => {
            const pr = event.cookedEvent.data.pull_request;
            const head = event.cookedEvent.data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            let approvedMaintainers;
            let approvedReviewers;
            if (event.cookedEvent.data.action !== 'opened') {
                return Promise.resolve();
            }
            this.logger.log(logger_1.LogLevel.INFO, `Checking reviewers list for ${owner}/${repo}#${pr.number}`);
            return this.retrieveConfiguration({
                emitter: this.githubEmitter,
                location: {
                    owner,
                    repo,
                    path: RepositoryFilePath
                }
            }).then((config) => {
                approvedMaintainers = this.stripPRAuthor((config || {}).maintainers || null, pr) || [];
                approvedReviewers = this.stripPRAuthor((config || {}).reviewers || null, pr) || [];
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        number: pr.number,
                        owner,
                        repo
                    },
                    method: this.githubApi.pullRequests.get
                });
            }).then((pullRequest) => {
                const assignedReviewers = _.map(pullRequest.requested_reviewers, (reviewer) => reviewer.login);
                const configuredReviewers = _.uniq(_.unionWith(approvedReviewers, approvedMaintainers));
                let missingReviewers = _.filter(configuredReviewers, (reviewer) => {
                    return !(_.find(assignedReviewers, (assignedReviewer) => (assignedReviewer === reviewer)) ||
                        (reviewer === pr.user.login));
                });
                if (missingReviewers.length > 0) {
                    let reviewerMessage = '';
                    _.each(missingReviewers, (reviewer) => {
                        reviewerMessage += `@${reviewer}, `;
                    });
                    reviewerMessage += ReviewerAddMessage;
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            owner,
                            repo,
                            number: pr.number,
                            body: reviewerMessage
                        },
                        method: this.githubApi.issues.createComment
                    });
                }
            });
        };
        this.checkReviewers = (_registration, event) => {
            const pr = event.cookedEvent.data.pull_request;
            const head = event.cookedEvent.data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            let botConfig;
            this.logger.log(logger_1.LogLevel.INFO, `Checking reviewer conditions for ${owner}/${repo}#${pr.number}`);
            return this.retrieveConfiguration({
                emitter: this.githubEmitter,
                location: {
                    owner,
                    repo,
                    path: RepositoryFilePath
                }
            }).then((config) => {
                botConfig = config;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        number: pr.number,
                        owner,
                        repo
                    },
                    method: this.githubApi.pullRequests.getReviews
                });
            }).then((reviews) => {
                const approvalsNeeded = (botConfig || {}).minimum_approvals || 1;
                let approvedCount = 0;
                let reviewers = {};
                let status = '';
                let approvedPR = false;
                const approvedMaintainers = this.stripPRAuthor((botConfig || {}).maintainers || null, pr);
                const approvedReviewers = this.stripPRAuthor((botConfig || {}).reviewers || null, pr);
                if (approvalsNeeded < 1) {
                    return this.reportError({
                        brief: 'Invalid number of approvals required',
                        message: 'The number of approvals required to merge a PR is less than one. At least ' +
                            `one approval is required. Please ask a maintainer to correct the \`minimum_approvals\` ` +
                            `value in the config file (current value: ${approvalsNeeded})`,
                        number: pr.number,
                        owner,
                        repo
                    });
                }
                if (approvedReviewers) {
                    const mergedReviewers = _.unionWith(approvedReviewers, approvedMaintainers || [], _.isEqual);
                    if (mergedReviewers.length < approvalsNeeded) {
                        return this.reportError({
                            brief: 'Not enough reviewers for PR approval',
                            message: 'The number of approved reviewers for the repository is less than the ' +
                                `number of approvals that are required for the PR to be merged (${approvalsNeeded}).`,
                            number: pr.number,
                            owner,
                            repo
                        });
                    }
                }
                reviews.forEach((review) => {
                    const reviewer = review.user.login;
                    if (review.state === 'APPROVED') {
                        reviewers[reviewer] = ReviewState.Approved;
                    }
                    else if (review.state === 'CHANGES_REQUESTED') {
                        reviewers[reviewer] = ReviewState.ChangesRequired;
                    }
                });
                if (_.find(reviewers, (state) => state === ReviewState.ChangesRequired)) {
                    status = 'Changes have been requested by at least one reviewer';
                }
                else {
                    let reviewersApproved = _.map(reviewers, (_val, key) => key);
                    let appendStatus = '';
                    if (approvedReviewers || approvedMaintainers) {
                        if (approvedReviewers) {
                            reviewersApproved = _.filter(reviewersApproved, (reviewer) => {
                                if (approvedReviewers && _.find(approvedReviewers, (login) => login === reviewer) ||
                                    (approvedMaintainers && _.find(approvedMaintainers, (login) => login === reviewer))) {
                                    return true;
                                }
                                return false;
                            });
                        }
                    }
                    approvedCount = reviewersApproved.length;
                    if (approvedMaintainers) {
                        if (_.intersection(reviewersApproved, approvedMaintainers).length < 1) {
                            approvedCount = (approvedCount >= approvalsNeeded) ? (approvalsNeeded - 1) : approvedCount;
                            appendStatus = ' - Maintainer approval required';
                        }
                    }
                    status = `${approvedCount}/${approvalsNeeded} review approvals met${appendStatus}`;
                    approvedPR = (approvedCount >= approvalsNeeded) ? true : false;
                }
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        context: 'VersionBot',
                        description: status,
                        owner: pr.head.repo.owner.login,
                        repo: pr.head.repo.name,
                        sha: pr.head.sha,
                        state: approvedPR ? 'success' : 'failure'
                    },
                    method: this.githubApi.repos.createStatus
                });
            });
        };
        this.checkFooterTags = (_registration, event) => {
            const prEvent = event.cookedEvent.data;
            const pr = prEvent.pull_request;
            const head = pr.head;
            const owner = head.repo.owner.login;
            const name = head.repo.name;
            const author = prEvent.sender.login;
            let committer = author;
            let lastCommit;
            let botConfig;
            if ((event.cookedEvent.data.action !== 'opened') && (event.cookedEvent.data.action !== 'synchronize') &&
                (event.cookedEvent.data.action !== 'labeled')) {
                return Promise.resolve();
            }
            this.logger.log(logger_1.LogLevel.INFO, `Checking footer tags for ${owner}/${name}#${pr.number}`);
            return this.retrieveConfiguration({
                emitter: this.githubEmitter,
                location: {
                    owner,
                    repo: name,
                    path: RepositoryFilePath
                }
            }).then((config) => {
                botConfig = config;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        number: pr.number,
                        repo: name,
                    },
                    method: this.githubApi.pullRequests.getCommits
                });
            }).then((commits) => {
                const missingTags = this.checkCommitFooterTags(commits, botConfig);
                if (commits.length > 0) {
                    lastCommit = commits[commits.length - 1];
                    if (lastCommit.committer) {
                        committer = lastCommit.committer.login;
                    }
                }
                if (missingTags.length === 0) {
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            context: 'Versionist',
                            description: 'Found all required commit footer tags',
                            owner,
                            repo: name,
                            sha: head.sha,
                            state: 'success'
                        },
                        method: this.githubApi.repos.createStatus
                    });
                }
                let tagNames = '';
                _.each(missingTags, (tag) => {
                    tagNames += `${tag.name}, `;
                });
                this.logger.log(logger_1.LogLevel.INFO, `Missing tags from accumulated commits: ${tagNames}` +
                    `for ${owner}/${name}#${pr.number}`);
                let description = 'Missing or forbidden tags in commits, see `repository.yml`';
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        context: 'Versionist',
                        description,
                        owner,
                        repo: name,
                        sha: head.sha,
                        state: 'failure'
                    },
                    method: this.githubApi.repos.createStatus,
                });
            }).then(() => {
                return this.checkStatuses(pr);
            }).then((checkStatus) => {
                if (checkStatus === StatusChecks.Failed) {
                    const lastCommitTimestamp = Date.parse(lastCommit.commit.committer.date);
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            owner,
                            repo: name,
                            number: pr.number,
                        },
                        method: this.githubApi.issues.getComments
                    }).then((comments) => {
                        if (_.some(comments, (comment) => {
                            return ((comment.user.type === 'Bot') &&
                                (lastCommitTimestamp < Date.parse(comment.created_at)) &&
                                !_.endsWith(comment.body, ReviewerAddMessage));
                        })) {
                            return Promise.resolve();
                        }
                        let warningUsers = '';
                        warningUsers = `@${author}, `;
                        if (author !== committer) {
                            warningUsers += `@${committer}, `;
                        }
                        return this.dispatchToEmitter(this.githubEmitterName, {
                            data: {
                                body: `${warningUsers}status checks have failed for this PR. Please make appropriate ` +
                                    'changes and recommit.',
                                owner,
                                number: pr.number,
                                repo: name,
                            },
                            method: this.githubApi.issues.createComment,
                        });
                    });
                }
            }).then(() => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        number: pr.number,
                        owner,
                        repo: name
                    },
                    method: this.githubApi.issues.getIssueLabels
                });
            }).then((labels) => {
                if (_.some(labels, (label) => label.name === MergeLabel)) {
                    if (pr.state === 'open') {
                        return this.finaliseMerge(event.cookedEvent.data, pr);
                    }
                }
            }).catch((err) => {
                this.reportError({
                    brief: `${process.env.VERSIONBOT_NAME} check failed for ${owner}/${name}#${pr.number}`,
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
            let branchName = pr.head.ref;
            let botConfig;
            switch (cookedData.data.action) {
                case 'submitted':
                case 'labeled':
                    break;
                default:
                    return Promise.resolve();
            }
            this.logger.log(logger_1.LogLevel.INFO, `PR is ready to merge, attempting to carry out a ` +
                `version up for ${owner}/${repo}#${pr.number}`);
            return this.retrieveConfiguration({
                emitter: this.githubEmitter,
                location: {
                    owner,
                    repo,
                    path: RepositoryFilePath
                }
            }).then((config) => {
                botConfig = config;
                if (pr.mergeable !== true) {
                    throw new Error('The branch cannot currently be merged into master. It has a state of: ' +
                        `\`${pr.mergeable_state}\``);
                }
                return this.checkStatuses(pr);
            }).then((checkStatus) => {
                if ((checkStatus === StatusChecks.Failed) || (checkStatus === StatusChecks.Pending)) {
                    throw new Error('checksPendingOrFailed');
                }
                return this.getVersionBotCommits(pr);
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
                });
            }).then(() => {
                this.logger.log(logger_1.LogLevel.INFO, `Upped version of ${repoFullName}#${pr.number} to ` +
                    `${newVersion}; tagged and pushed.`);
            }).catch((err) => {
                if ((err.message !== 'alreadyCommitted') && (err.message !== 'checksPendingOrFailed')) {
                    this.reportError({
                        brief: `${process.env.VERSIONBOT_NAME} failed to merge ${repoFullName}#${pr.number}`,
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
        this.finaliseMerge = (data, prInfo) => {
            const owner = prInfo.head.repo.owner.login;
            const repo = prInfo.head.repo.name;
            return this.checkStatuses(prInfo).then((checkStatus) => {
                if (checkStatus === StatusChecks.Passed) {
                    return this.getVersionBotCommits(prInfo).then((commitMessage) => {
                        if (commitMessage) {
                            return this.retrieveConfiguration({
                                emitter: this.githubEmitter,
                                location: {
                                    owner,
                                    repo,
                                    path: RepositoryFilePath
                                }
                            }).then((config) => {
                                if (data.action === 'labeled') {
                                    this.checkValidMaintainer(config, data);
                                }
                                return this.mergeToMaster({
                                    commitVersion: commitMessage,
                                    pullRequest: prInfo
                                });
                            }).then(() => {
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
        this.emailAddress = email;
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
        this.githubEmitter = ghEmitter;
        this.githubEmitterName = this.githubEmitter.serviceName;
        this.githubApi = this.githubEmitter.apiHandle.github;
        if (!this.githubApi) {
            throw new Error('No Github API instance found');
        }
        _.forEach([
            {
                name: 'CheckVersionistCommitStatus',
                events: ['pull_request'],
                listenerMethod: this.checkFooterTags,
                suppressionLabels: [IgnoreLabel],
            },
            {
                name: 'CheckReviewerStatus',
                events: ['pull_request', 'pull_request_review'],
                listenerMethod: this.checkReviewers,
                suppressionLabels: [IgnoreLabel],
            },
            {
                name: 'CheckForWaffleFlow',
                events: ['pull_request'],
                listenerMethod: this.checkWaffleFlow,
            },
            {
                name: 'AddMissingReviewers',
                events: ['pull_request'],
                listenerMethod: this.addReviewers,
                suppressionLabels: [IgnoreLabel],
            },
            {
                name: 'CheckForReadyMergeState',
                events: ['pull_request', 'pull_request_review'],
                listenerMethod: this.mergePR,
                suppressionLabels: [IgnoreLabel],
                triggerLabels: [MergeLabel],
            },
            {
                name: 'StatusChangeState',
                events: ['status'],
                listenerMethod: this.statusChange,
            }
        ], (reg) => {
            ghListener.registerEvent(reg);
        });
    }
    applyVersionist(versionData) {
        return Promise.mapSeries([
            environment_1.BuildCommand('git', ['clone', `https://${versionData.authToken}:${versionData.authToken}@github.com/` +
                    `${versionData.repoFullName}`, `${versionData.fullPath}`], { cwd: `${versionData.fullPath}`, retries: 3 }),
            environment_1.BuildCommand('git', ['checkout', `${versionData.branchName}`], { cwd: `${versionData.fullPath}` })
        ], environment_1.ExecuteCommand).then(() => {
            return fsFileExists(`${versionData.fullPath}/versionist.conf.js`)
                .return(true)
                .catch((err) => {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
                return false;
            });
        }).catch(() => {
            throw new Error(`Cloning of branch ${versionData.branchName} in ${versionData.repoFullName} failed`);
        }).then((exists) => {
            let versionistCommand;
            let versionistArgs = [];
            return this.getNodeBinPath().then((nodePath) => {
                versionistCommand = path.join(nodePath, 'versionist');
                if (exists) {
                    versionistArgs = ['-c', 'versionist.conf.js'];
                    this.logger.log(logger_1.LogLevel.INFO, 'Found an overriding versionist config ' +
                        `for ${versionData.repoFullName}, using that`);
                }
            }).then(() => {
                return Promise.mapSeries([
                    environment_1.BuildCommand(versionistCommand, versionistArgs, { cwd: `${versionData.fullPath}` }),
                    environment_1.BuildCommand('git', ['status', '-s'], { cwd: `${versionData.fullPath}` })
                ], environment_1.ExecuteCommand);
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
            return fsReadFile(`${versionData.fullPath}${_.last(moddedFiles)}`, { encoding: 'utf8' })
                .then((contents) => {
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
        let newTreeSha;
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                owner: repoData.owner,
                repo: repoData.repo,
                sha: repoData.branchName
            },
            method: this.githubApi.gitdata.getTree
        }).then((treeData) => {
            return Promise.map(repoData.files, (file) => {
                const treeEntry = _.find(treeData.tree, (entry) => {
                    return entry.path === file.file;
                });
                if (!treeEntry) {
                    throw new Error(`Couldn't find a git tree entry for the file ${file.file}`);
                }
                file.treeEntry = treeEntry;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        content: file.encoding,
                        encoding: 'base64',
                        owner: repoData.owner,
                        repo: repoData.repo
                    },
                    method: this.githubApi.gitdata.createBlob
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
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        base_tree: treeData.sha,
                        owner: repoData.owner,
                        repo: repoData.repo,
                        tree: newTree
                    },
                    method: this.githubApi.gitdata.createTree
                });
            }).then((newTree) => {
                newTreeSha = newTree.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner: repoData.owner,
                        repo: repoData.repo,
                        sha: `${repoData.branchName}`
                    },
                    method: this.githubApi.repos.getCommit
                });
            }).then((lastCommit) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        committer: {
                            email: this.emailAddress,
                            name: this._botname
                        },
                        message: `${repoData.version}`,
                        owner: repoData.owner,
                        parents: [lastCommit.sha],
                        repo: repoData.repo,
                        tree: newTreeSha
                    },
                    method: this.githubApi.gitdata.createCommit
                });
            }).then((commit) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        force: false,
                        owner: repoData.owner,
                        ref: `heads/${repoData.branchName}`,
                        repo: repoData.repo,
                        sha: commit.sha
                    },
                    method: this.githubApi.gitdata.updateReference
                });
            });
        });
    }
    mergeToMaster(data) {
        const pr = data.pullRequest;
        const owner = pr.head.repo.owner.login;
        const repo = pr.head.repo.name;
        const prNumber = pr.number;
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                commit_title: `Auto-merge for PR #${prNumber} via ${process.env.VERSIONBOT_NAME}`,
                number: prNumber,
                owner,
                repo
            },
            method: this.githubApi.pullRequests.merge
        }).then((mergedData) => {
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    message: data.commitVersion,
                    object: mergedData.sha,
                    owner,
                    repo,
                    tag: data.commitVersion,
                    tagger: {
                        email: this.emailAddress,
                        name: this._botname
                    },
                    type: 'commit'
                },
                method: this.githubApi.gitdata.createTag
            });
        }).then((newTag) => {
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    ref: `refs/tags/${data.commitVersion}`,
                    repo,
                    sha: newTag.sha
                },
                method: this.githubApi.gitdata.createReference
            });
        }).then(() => {
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    name: MergeLabel,
                    number: prNumber,
                    owner,
                    repo
                },
                method: this.githubApi.issues.removeLabel
            });
        }).then(() => {
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    ref: `heads/${pr.head.ref}`,
                    repo
                },
                method: this.githubApi.gitdata.deleteReference
            });
        }).catch((err) => {
            if (err.message !== 'Pull Request is not mergeable') {
                throw err;
            }
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    number: prNumber,
                    owner,
                    repo
                },
                method: this.githubApi.pullRequests.get
            }).then((mergePr) => {
                if (mergePr.state === 'open') {
                    throw err;
                }
            });
        });
    }
    checkStatuses(prInfo) {
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;
        const branch = prInfo.head.ref;
        let protectedContexts = [];
        const statusLUT = {
            failure: StatusChecks.Failed,
            pending: StatusChecks.Pending,
            success: StatusChecks.Passed,
        };
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                branch: 'master',
                owner,
                repo
            },
            method: this.githubApi.repos.getProtectedBranchRequiredStatusChecks
        }).then((statusContexts) => {
            protectedContexts = statusContexts.contexts;
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    ref: branch,
                    repo
                },
                method: this.githubApi.repos.getCombinedStatus
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
    getVersionBotCommits(prInfo) {
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                owner,
                repo,
                sha: prInfo.head.sha
            },
            method: this.githubApi.repos.getCommit
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
    stripPRAuthor(list, pullRequest) {
        const filteredList = list ? _.filter(list, (reviewer) => reviewer !== pullRequest.user.login) : null;
        return (filteredList && (filteredList.length === 0)) ? null : filteredList;
    }
    checkValidMaintainer(config, event) {
        const maintainers = (config || {}).maintainers;
        if (maintainers) {
            if (!_.includes(maintainers, event.sender.login)) {
                let errorMessage = `The \`${MergeLabel}\` label was not added by an authorised ` +
                    'maintainer. Authorised maintainers are:\n';
                _.each(maintainers, (maintainer) => errorMessage = errorMessage.concat(`* @${maintainer}\n`));
                throw new Error(errorMessage);
            }
        }
    }
    checkCommitFooterTags(allCommits, config) {
        const tagDefinitions = (config || {})['required-tags'] || {};
        const changeType = 'change-type';
        const tagOccurrences = ['all', 'once', 'never'];
        const tagValueFlags = ['i', 'u', 'y', 'g', 'm'];
        let sanitisedDefs = {};
        let tagCounts = {};
        const commits = _.filter(allCommits, (commit) => commit.commit.committer.name !== process.env.VERSIONBOT_NAME);
        _.each(_.mapKeys(tagDefinitions, (_value, key) => key.toLowerCase()), (tag, tagName) => {
            if (tagCounts[tagName]) {
                throw new Error(`More than one occurrence of a required footer tag (${tagName}) found ` +
                    'in configuration');
            }
            if (tag.occurrence) {
                if ((typeof tag.occurrence !== 'string') ||
                    !_.find(tagOccurrences, (occurrence) => tag.occurrence === occurrence)) {
                    throw new Error(`Invalid occurrence value found for ${tagName} definition`);
                }
            }
            if (tag.values && tag.flags) {
                _.each(tag.flags, (char) => {
                    if (!_.find(tagValueFlags, (flag) => flag !== char)) {
                        throw new Error(`Invalid RegExp flags specific for ${tagName} definition`);
                    }
                });
            }
            tagCounts[tagName] = 0;
            sanitisedDefs[tagName] = {
                occurrence: tag.occurrence,
                values: tag.values,
                flags: tag.flags
            };
        });
        sanitisedDefs[changeType] = sanitisedDefs[changeType] || {
            values: '\s*(patch|minor|major)\s*',
            flags: 'i'
        };
        tagCounts[changeType] = tagCounts[changeType] || 0;
        for (let commit of commits) {
            const commitMessage = commit.commit.message;
            const lines = commitMessage.split('\n');
            const lastLine = _.findLastIndex(lines, (line) => line.match(/^\s*$/));
            if (lastLine > 0) {
                lines.splice(0, lastLine);
                const footer = lines.join('\n');
                _.each(sanitisedDefs, (tag, name) => {
                    const keyRE = new RegExp(`^${name}:(.*)$`, 'gmi');
                    let valueRE = /.*/;
                    if (tag.values) {
                        valueRE = new RegExp(`${tag.values}$`, tag.flags);
                    }
                    let valueMatches = [];
                    let match = keyRE.exec(footer);
                    while (match) {
                        valueMatches.push(match[1]);
                        match = keyRE.exec(footer);
                    }
                    for (let valueMatch of valueMatches) {
                        const valueFound = valueMatch.match(valueRE);
                        if (valueFound) {
                            tagCounts[name]++;
                            break;
                        }
                    }
                });
            }
        }
        let tagResults = [];
        _.each(sanitisedDefs, (tag, name) => {
            const tagCount = tagCounts[name] || 0;
            let tagsRequired = 0;
            if (tag.occurrence !== 'never') {
                tagsRequired = 1;
                if (tag.occurrence === 'all') {
                    tagsRequired = commits.length;
                }
                if (tagCount < tagsRequired) {
                    tagResults.push({
                        name,
                        reason: `Not enough occurrences of ${name} tag found in PR commits`
                    });
                }
            }
            else {
                if (tagCount > 0) {
                    tagResults.push({
                        name,
                        reason: `The ${name} tag was found when it should not be present in a PR commit`
                    });
                }
            }
        });
        return tagResults;
    }
    reportError(error) {
        this.logger.alert(logger_1.AlertLevel.ERROR, error.message);
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                body: error.message,
                number: error.number,
                owner: error.owner,
                repo: error.repo
            },
            method: this.githubApi.issues.createComment
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
    return new VersionBot(process.env.VERSIONBOT_INTEGRATION_ID, process.env.VERSIONBOT_NAME, process.env.VERSIONBOT_EMAIL, process.env.VERSIONBOT_PEM, process.env.VERSIONBOT_WEBHOOK_SECRET);
}
exports.createBot = createBot;

//# sourceMappingURL=versionbot.js.map
