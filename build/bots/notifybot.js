"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const yaml = require("js-yaml");
const _ = require("lodash");
const resin_semver_1 = require("resin-semver");
const TypedError = require("typed-error");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
var NotifyErrorCodes;
(function (NotifyErrorCodes) {
    NotifyErrorCodes[NotifyErrorCodes["KeyframeNotFound"] = 0] = "KeyframeNotFound";
    NotifyErrorCodes[NotifyErrorCodes["ConversationPostFailed"] = 1] = "ConversationPostFailed";
    NotifyErrorCodes[NotifyErrorCodes["OldVersionInvalid"] = 2] = "OldVersionInvalid";
    NotifyErrorCodes[NotifyErrorCodes["NewVersionInvalid"] = 3] = "NewVersionInvalid";
})(NotifyErrorCodes || (NotifyErrorCodes = {}));
class NotifyBotError extends TypedError {
    constructor(code, message, owner, repo, version) {
        super();
        this.type = 'NotifyBotError';
        this.code = code;
        this.message = message;
        this.owner = owner;
        this.repo = repo;
        this.version = version;
    }
}
const NotifyBotPort = 8399;
const IssueRefRE = new RegExp('(?:close[sd]?|fix(?:e[sd]{1})?|resolve[sd]?):?|' +
    'connect(?:(?:s|ed)?\\s+(?:to)?:?|s-to:)\\s+(#[0-9]+)', 'gi');
const HqRE = /hq:\s+https:\/\/github.com\/resin-io\/hq\/issues\/([0-9]+)/gi;
const KeyframeFile = 'keyframe.yml';
const ChangelogFile = 'CHANGELOG.md';
const VirginRef = '0000000000000000000000000000000000000000';
const HqOwner = 'resin-io';
const HqRepo = 'hq';
const WebhookPath = '/notifyhooks';
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
            if ((oldHash === VirginRef) || (newHash === VirginRef)) {
                return Promise.resolve();
            }
            if (!_.some(commits, (commit) => _.includes(commit.modified, KeyframeFile))) {
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
                    throw new Error(`Couldn't find the new hash for the Keyframe: ${owner}/${repo}:${newHash}`);
                }
                newFile = fileContents;
                const oldComponents = yaml.safeLoad(oldFile).keyframe.components || {};
                const newComponents = yaml.safeLoad(newFile).keyframe.components;
                const componentVersions = [];
                _.each(newComponents, (value, key) => {
                    const newVersion = value.version;
                    const oldVersion = _.get(oldComponents[key], 'version', null);
                    const componentRepo = value.repository;
                    if (newVersion && repo && (newVersion !== oldVersion)) {
                        componentVersions.push({
                            oldVersion,
                            name: key,
                            newVersion,
                            repo: componentRepo,
                            incrementing: true,
                            versions: undefined
                        });
                    }
                    else if (newVersion === oldVersion) {
                        this.logger.log(logger_1.LogLevel.INFO, `Component version for ${componentRepo} static, nothing to do ` +
                            `for ${repo}`);
                    }
                });
                return Promise.map(componentVersions, (component) => this.getNewPRs(component));
            })
                .filter((component) => _.has(component, 'versions'))
                .then((components) => {
                return Promise.map(components, (component) => {
                    return Promise.all(_.map(component.versions, (prs, key) => {
                        return this.tracePRAndNotify({
                            environment: repo,
                            repo: component.repo,
                            version: key,
                            deployedVersion: component.newVersion.substring(1),
                            incrementing: component.incrementing,
                            prs
                        });
                    }));
                }).return();
            }).catch((err) => {
                this.reportError(new NotifyBotError(NotifyErrorCodes.KeyframeNotFound, `${process.env.NOTIFYBOT_NAME} failed to find Keyframe versions. The reason ` +
                    `for this is:\r\n${err.message}\r\n` +
                    'Please carry out relevant changes or alert an appropriate admin.', owner, repo, 'unknown'));
            });
        };
        const ghListener = this.addServiceListener('github', {
            client: config.botName,
            authentication: {
                appId: config.githubApp,
                pem: config.githubPEM,
                type: 0
            },
            path: WebhookPath,
            port: NotifyBotPort,
            type: 0,
            webhookSecret: config.githubSecret
        });
        const ghEmitter = this.addServiceEmitter('github', {
            authentication: {
                appId: config.githubApp,
                pem: config.githubPEM,
                type: 0
            },
            pem: config.githubPEM,
            type: 1
        });
        const frontEmitter = this.addServiceEmitter('front', {
            token: config.frontApiKey,
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
        this.githubEmitterName = ghEmitter.serviceName;
        this.frontEmitterName = frontEmitter.serviceName;
        this.githubApi = ghEmitter.apiHandle.github;
        if (!this.githubApi) {
            throw new Error('No Github App API instance found');
        }
        const frontHandles = frontEmitter.apiHandle;
        this.frontApi = frontHandles.front;
        this.frontUser = config.frontUser;
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
            return Promise.join(this.dispatchToEmitter(this.githubEmitterName, {
                data: prData,
                method: this.githubApi.issues.getComments,
            }), this.dispatchToEmitter(this.githubEmitterName, {
                data: prData,
                method: this.githubApi.pullRequests.get
            }), (comments, pullRequest) => {
                return _.concat(_.flatMap(comments, (comment) => this.matchIssue(comment.body, IssueRefRE)), this.matchIssue(pullRequest.body, IssueRefRE), _.flatMap(comments, (comment) => this.matchIssue(comment.body, HqRE)), this.matchIssue(pullRequest.body, HqRE));
            }).then((issueNumbers) => {
                return Promise.mapSeries(issueNumbers, (issueNumber) => {
                    let topicIssues;
                    return this.getTopicsOnIssue(issueNumber, repoDetails.owner, repoDetails.repo)
                        .then((results) => {
                        topicIssues = results;
                        return this.retrieveTopics(topicIssues.topics);
                    }).then((conversations) => {
                        let bodyMessage;
                        if (prDetails.incrementing) {
                            bodyMessage = `Deployed version ${prDetails.deployedVersion} of ${prDetails.repo} on ` +
                                `the ${prDetails.environment} has affected the following issues that are attached ` +
                                'to this conversation:';
                        }
                        else {
                            bodyMessage = `Regression to version ${prDetails.deployedVersion} of ${prDetails.repo} ` +
                                `on the ${prDetails.environment} means the following issues attached to this ` +
                                'conversation are relevant again:';
                        }
                        bodyMessage += '\n' + topicIssues.relatedIssues.join('\n');
                        return Promise.map(conversations, (conversation) => {
                            this.logger.log(logger_1.LogLevel.INFO, `---> Commenting on Front ${conversation} for ` +
                                `${prData.owner}/${prData.repo}#${prData.number}:${prDetails.version};` +
                                ` deployed version: ${prDetails.deployedVersion}`);
                            return this.dispatchToEmitter(this.frontEmitterName, {
                                data: {
                                    author_id: `alt:email:${this.frontUser}`,
                                    body: bodyMessage,
                                    conversation_id: conversation,
                                },
                                method: this.frontApi.comment.create,
                            });
                        });
                    }).catch((err) => {
                        this.logger.alert(logger_1.AlertLevel.ERROR, 'Couldn\'t retrieve or post to the relevant Front ' +
                            `conversations for \`${prData.owner}/${prData.repo}#${prData.number}:` +
                            `${prDetails.version}\`: ${err.message}`);
                    });
                });
            }).then(() => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: prData,
                    method: this.githubApi.pullRequests.get
                }).then((pullRequest) => {
                    let body;
                    if (prDetails.incrementing) {
                        body = `Hi @${pullRequest.user.login}! This PR is now deployed in version ` +
                            `\`${prDetails.deployedVersion}\` on the \`${prDetails.environment}\` environment. ` +
                            `It was originally merged in version \`${prDetails.version}\`. Please remember to publish ` +
                            'release notes on the `r/devops-reliability` flowdock channel.';
                    }
                    else {
                        body = `Hi @${pullRequest.user.login}! This PR has been revoked as part of the deploy of ` +
                            `version \`${prDetails.deployedVersion}\` on the \`${prDetails.environment}\` environment. ` +
                            `It was originally merged in version \`${prDetails.version}\`. Please check with admins on ` +
                            '`r/devops-reliability` as to why this occurred.';
                    }
                    this.logger.log(logger_1.LogLevel.INFO, `--> Commenting on PR ${prData.owner}/${prData.repo}#` +
                        `${prData.number}:${prDetails.version}; deployed version: ${prDetails.deployedVersion}`);
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            body,
                            number: prData.number,
                            owner: prData.owner,
                            repo: prData.repo,
                        },
                        method: this.githubApi.issues.createComment
                    });
                });
            });
        }).catch((err) => {
            this.reportError(new NotifyBotError(NotifyErrorCodes.ConversationPostFailed, `Couldn't post to the conversation or PR for the specified issue: ${err}`, repoDetails.owner, repoDetails.repo, prDetails.version));
        }).return();
    }
    matchIssue(text, regExp) {
        const results = [];
        let match = regExp.exec(text);
        while (match) {
            if (!_.includes(results, match[1])) {
                results.push(match[1]);
            }
            match = regExp.exec(text);
        }
        return results;
    }
    getTopicsOnIssue(issueNumber, issueOwner, issueRepo) {
        let skipHqIssue = true;
        const getIssueAndComments = (issue, owner, repo, method) => {
            return Promise.join(this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    number: issue,
                    owner,
                    repo,
                },
                method: this.githubApi.issues.get,
            }), this.dispatchToEmitter(this.githubEmitterName, {
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
        const matchFrontTopics = (issue, comments) => {
            const frontRE = /\[front conversations\]\((.*)\)/gi;
            return _.concat(this.matchIssue(issue.body, frontRE), _.flatMap(comments, (comment) => this.matchIssue(comment.body, frontRE)));
        };
        const githubURL = `https://github.com`;
        const relatedIssues = [];
        if (_.startsWith(issueNumber, '#')) {
            issueNumber = issueNumber.substring(1);
            skipHqIssue = false;
        }
        return getIssueAndComments(issueNumber, issueOwner, issueRepo, (issue, comments) => {
            const hqRefs = _.concat(_.flatMap(comments, (comment) => this.matchIssue(comment.body, HqRE)), this.matchIssue(issue.body, HqRE));
            let frontTopics = matchFrontTopics(issue, comments);
            if (frontTopics.length > 0) {
                relatedIssues.push(`${issue.title}: ${githubURL}/${issueOwner}/${issueRepo}/issues/${issueNumber}`);
            }
            if (!skipHqIssue && (hqRefs.length > 0)) {
                return Promise.mapSeries(hqRefs, (hqRef) => {
                    return getIssueAndComments(hqRef, HqOwner, HqRepo, (hqIssue, hqComments) => {
                        const hqTopics = matchFrontTopics(hqIssue, hqComments);
                        if (hqTopics.length > 0) {
                            relatedIssues.push(`${hqIssue.title}: ${githubURL}/${HqOwner}/` +
                                `${HqRepo}/issues/${hqRef}`);
                        }
                        return hqTopics;
                    });
                }).then((hqRefFrontTopics) => {
                    return frontTopics.concat(_.flatten(hqRefFrontTopics));
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
        let allTags;
        if (!repo) {
            throw new Error(`Cannot find appropriate repo/owner for ${component.repo}`);
        }
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                owner: repo.owner,
                repo: repo.repo
            },
            method: this.githubApi.repos.getTags
        }).then((tags) => {
            allTags = _.map(tags, 'name');
            return this.retrieveFileFromHash({
                api: this.githubApi,
                filepath: ChangelogFile,
                hash: 'HEAD',
                owner: repo.owner,
                repo: repo.repo,
            });
        }).then((file) => {
            if (!file) {
                throw new Error(`Couldn't find the CHANGELOG.md in ${repo.owner}/${repo.repo}`);
            }
            let changeParts = [file];
            let changelogString = '';
            if (component.oldVersion) {
                if (!_.includes(allTags, component.oldVersion)) {
                    this.reportError(new NotifyBotError(NotifyErrorCodes.OldVersionInvalid, `The old version of the component in the old keyframe was invalid`, repo.owner, repo.repo, component.oldVersion));
                    return component;
                }
            }
            if (!_.includes(allTags, component.newVersion)) {
                this.reportError(new NotifyBotError(NotifyErrorCodes.NewVersionInvalid, `The new version of the component in the new keyframe was invalid`, repo.owner, repo.repo, component.newVersion));
                return component;
            }
            if (!component.oldVersion) {
                component.incrementing = true;
            }
            else if (resin_semver_1.gt(component.oldVersion, component.newVersion)) {
                component.incrementing = false;
            }
            else if (resin_semver_1.gt(component.newVersion, component.oldVersion)) {
                component.incrementing = true;
            }
            if (component.oldVersion) {
                changeParts = changeParts[0].split(component.incrementing ? `## ${component.oldVersion}` :
                    `## ${component.newVersion}`);
            }
            changelogString = `## ${component.incrementing ? component.newVersion : component.oldVersion}` +
                changeParts[0].split(component.incrementing ? component.newVersion : (component.oldVersion || ''))[1];
            const versionEntries = changelogString.split('## ');
            const versionTracker = {};
            _.each(versionEntries, (versionData) => {
                let verMatches;
                const versionMatch = versionData.match(/^v([0-9]+\.[0-9]+\.[0-9]+)/);
                if (versionMatch) {
                    const version = versionMatch[1];
                    const matchRE = /\*\s+.*\s+#([0-9]+)\s\[.*\]/gm;
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
        return this.dispatchToEmitter(this.githubEmitterName, request).then((file) => {
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
            return this.dispatchToEmitter(this.frontEmitterName, {
                data: {
                    topic_id: shortenedTopic
                },
                method: this.frontApi.topic.listConversations
            }).then((conversations) => {
                return _.map(conversations._results, 'id');
            });
        }).then(_.flatten);
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
        this.logger.alert(logger_1.AlertLevel.ERROR, `${error.message}: ${error.owner}/${error.repo}:${error.version}`);
    }
}
exports.NotifyBot = NotifyBot;
function createBot() {
    const notifyBotConfig = {
        botName: process.env.NOTIFYBOT_NAME,
        frontApiKey: process.env.NOTIFYBOT_FRONT_API_KEY,
        frontUser: process.env.NOTIFYBOT_FRONT_USERNAME,
        githubApp: process.env.NOTIFYBOT_GITHUB_INTEGRATION_ID,
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
