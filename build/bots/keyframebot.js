"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const ChildProcess = require("child_process");
const express = require("express");
const FS = require("fs");
const _ = require("lodash");
const path = require("path");
const temp_1 = require("temp");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
const keyframeControl = require("keyfctl");
const TypedError = require("typed-error");
const resin = require('resin-sdk')();
const jwtDecode = require('jwt-decode');
const exec = Promise.promisify(ChildProcess.exec);
const tempMkdir = Promise.promisify(temp_1.track().mkdir);
const tempCleanup = Promise.promisify(temp_1.cleanup);
const fsFileExists = Promise.promisify(FS.stat);
class HTTPError extends TypedError {
    constructor(code, message) {
        super();
        this.type = 'HttpError';
        this.httpCode = code;
        this.message = message;
    }
}
const DeployKeyframePath = '/deploykeyframe';
const KeyframeFilename = 'keyframe.yml';
const Environments = {
    'test': 'resin-io/procbots-private-test',
    'staging': 'blah',
    'production': 'blah',
};
class KeyframeBot extends procbot_1.ProcBot {
    constructor(integration, name, pemString, webhook) {
        super(name);
        this.lintKeyframe = (_registration, event) => {
            const cookedEvent = event.cookedEvent;
            const pr = cookedEvent.data.pull_request;
            const head = cookedEvent.data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            const prNumber = pr.number;
            let branchName = pr.head.ref;
            const authToken = cookedEvent.githubAuthToken;
            let fullPath = '';
            const cliCommand = (command) => {
                return exec(command, { cwd: fullPath });
            };
            this.logger.log(logger_1.LogLevel.INFO, `Linting ${owner}/${repo}#${prNumber} keyframe for issues`);
            return tempMkdir(`keyframebot-${repo}-${pr.number}_`).then((tempDir) => {
                fullPath = `${tempDir}${path.sep}`;
                return Promise.mapSeries([
                    `git clone https://${authToken}:${authToken}@github.com/${owner}/${repo} ${fullPath}`,
                    `git checkout ${branchName}`
                ], cliCommand);
            }).then(() => {
                const baseSha = pr.base.sha;
                const headSha = pr.head.sha;
                return keyframeControl.lint(baseSha, headSha, fullPath);
            }).then((lintResults) => {
                let lintMessage = "Keyframe linted successfully";
                let commentPromise = Promise.resolve();
                if (!lintResults.valid) {
                    lintMessage = "Keyframe linting failed";
                    const flattenedErrors = _.flatten(lintResults.messages);
                    let errorMessage = 'The following errors occurred whilst linting the `${KeyframeFilename}` file:\n';
                    _.each(flattenedErrors, (error) => {
                        errorMessage += `${error.message} at line ${error.parsedLine}: ${error.snippet}\n`;
                    });
                    commentPromise = this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            body: errorMessage,
                            owner,
                            repo,
                            number: prNumber,
                        },
                        method: this.githubApi.issues.createComment,
                    });
                }
                return commentPromise.then(() => {
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            context: 'KeyframeBot',
                            description: lintMessage,
                            owner,
                            repo,
                            sha: head.sha,
                            state: (lintResults.valid) ? 'success' : 'failure'
                        },
                        method: this.githubApi.repos.createStatus,
                    });
                });
            }).finally(tempCleanup);
        };
        this.deployKeyframe = (req, res) => {
            const payload = req.body;
            const environment = payload.environment;
            const version = payload.version;
            const headerToken = req.get('Authorization');
            let decodedToken;
            let owner = '';
            let repo = '';
            let deployDetails;
            const tokenMatch = headerToken.match(/^token (.*)$/i);
            if (!tokenMatch) {
                res.sendStatus(400);
                return;
            }
            const token = tokenMatch[1];
            return resin.auth.loginWithToken(token).then(() => {
                try {
                    decodedToken = jwtDecode(token);
                }
                catch (_err) {
                    throw new Error('Cannot decode token into JWT object');
                }
                if (!_.includes(decodedToken.permissions, 'admin.home')) {
                    throw new HTTPError(404, 'Invalid access rights');
                }
                const envRepo = Environments[environment];
                if (!envRepo) {
                    throw new HTTPError(400, 'Passed environment does not exist');
                }
                owner = envRepo.split('/')[0];
                repo = envRepo.split('/')[1];
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        path: KeyframeFilename,
                        ref: `refs/tags/${version}`
                    },
                    method: this.githubApi.repos.getContent
                });
            }).then((keyframeFile) => {
                if (keyframeFile.encoding !== 'base64') {
                    this.logger.log(logger_1.LogLevel.WARN, `Keyframe file exists for ${owner}/${repo} but is not ` +
                        `Base64 encoded! Aborting.`);
                    throw new HTTPError(500, 'Keyframe was not correctly encoded');
                }
                deployDetails = {
                    keyframe: keyframeFile,
                    username: decodedToken.username,
                    environment,
                    version,
                    owner,
                    repo
                };
                return this.createNewEnvironmentBranchCommit(deployDetails);
            }).then((branchName) => {
                console.log(branchName);
                return this.createNewPRFromBranch(deployDetails);
            }).then(() => {
                res.sendStatus(200);
            }).catch((err) => {
                let errorCode = (err instanceof HTTPError) ? err.httpCode : 500;
                this.logger.log(logger_1.LogLevel.INFO, `Error thrown in keyframe deploy:\n${err.message}`);
                res.status(errorCode).send(err.message);
            });
        };
        this.createNewEnvironmentBranchCommit = (branchDetails) => {
            const owner = branchDetails.owner;
            const repo = branchDetails.repo;
            const keyframe = branchDetails.keyframe;
            const environment = branchDetails.environment;
            const version = branchDetails.version;
            const user = branchDetails.username;
            const branchName = `${user}-${version}`;
            ;
            let branchSha = '';
            let keyframeEntry;
            let oldTreeSha = '';
            let newTreeSha = '';
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    ref: 'heads/master'
                },
                method: this.githubApi.gitdata.getReference
            }).then((reference) => {
                if (reference.ref !== 'refs/heads/master') {
                    throw new Error(`Master doesn't exist on ${owner}/${repo}`);
                }
                const headSha = reference.object.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        ref: `refs/heads/${branchName}`,
                        sha: headSha
                    },
                    method: this.githubApi.gitdata.createReference
                });
            }).then((reference) => {
                const branchReference = reference.ref;
                branchSha = reference.object.sha;
                if (!branchReference) {
                    throw new HTTPError(404, `Couldn't create the new branch for the ${environment} environment`);
                }
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        sha: branchSha,
                    },
                    method: this.githubApi.gitdata.getTree
                });
            }).then((tree) => {
                keyframeEntry = _.find(tree.tree, (entry) => entry.path === KeyframeFilename);
                if (!keyframeEntry) {
                    throw new HTTPError(404, `Couldn't find the keyframe file in the ${environment} repository`);
                }
                oldTreeSha = tree.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        content: keyframe.content,
                        encoding: keyframe.encoding
                    },
                    method: this.githubApi.gitdata.createBlob
                });
            }).then((blob) => {
                if (keyframeEntry) {
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            base_tree: oldTreeSha,
                            owner,
                            repo,
                            tree: [{
                                    mode: keyframeEntry.mode,
                                    path: keyframeEntry.path,
                                    sha: blob.sha,
                                    type: 'blob'
                                }]
                        },
                        method: this.githubApi.gitdata.createTree
                    });
                }
            }).then((newTree) => {
                newTreeSha = newTree.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        sha: branchSha
                    },
                    method: this.githubApi.repos.getCommit
                });
            }).then((lastCommit) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        message: `Update keyframe from product version ${version} on behalf of Resin user ${user}.`,
                        owner,
                        parents: [lastCommit.sha],
                        repo,
                        tree: newTreeSha
                    },
                    method: this.githubApi.gitdata.createCommit
                });
            }).then((commit) => {
                console.log(branchName);
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        force: false,
                        owner,
                        ref: `heads/${branchName}`,
                        repo,
                        sha: commit.sha
                    },
                    method: this.githubApi.gitdata.updateReference
                });
            }).return(branchName);
        };
        this.createNewPRFromBranch = (deploymentDetails) => {
            return Promise.resolve();
        };
        this.expressApp = express();
        if (!this.expressApp) {
            throw new Error("Couldn't create an Express application");
        }
        this.expressApp.use(bodyParser.urlencoded({ extended: true }));
        this.expressApp.use(bodyParser.json());
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/keyframehooks',
            port: process.env.PORT || 7788,
            type: 'listener',
            webhookSecret: webhook,
            express: this.expressApp
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
        this.githubApi = ghEmitter.apiHandle.github;
        if (!this.githubApi) {
            throw new Error('No Github API instance found');
        }
        this.expressApp.post(DeployKeyframePath, this.deployKeyframe);
        this.expressApp.listen(7788, () => {
            this.logger.log(logger_1.LogLevel.INFO, `---> Listening on various routes on 7788`);
        });
        _.forEach([
            {
                events: ['pull_request'],
                listenerMethod: this.lintKeyframe,
                name: 'LintProductKeyframe',
            },
        ], (reg) => {
            ghListener.registerEvent(reg);
        });
    }
    reportError(error) {
        this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                body: error.message,
                number: error.number,
                owner: error.owner,
                repo: error.repo
            },
            method: this.githubApi.issues.createComment
        });
        this.logger.alert(logger_1.AlertLevel.ERROR, error.message);
    }
}
exports.KeyframeBot = KeyframeBot;
function createBot() {
    if (!(process.env.KEYFRAMEBOT_NAME && process.env.KEYFRAMEBOT_INTEGRATION_ID &&
        process.env.KEYFRAMEBOT_PEM && process.env.KEYFRAMEBOT_WEBHOOK_SECRET)) {
        throw new Error(`'KEYFRAMEBOT_NAME', 'KEYFRAMEBOT_INTEGRATION_ID', 'KEYFRAMEBOT_PEM' and ` +
            `'KEYFRAMEBOT_WEBHOOK_SECRET environment variables need setting`);
    }
    return new KeyframeBot(process.env.KEYFRAMEBOT_INTEGRATION_ID, process.env.KEYFRAMEBOT_NAME, process.env.KEYFRAMEBOT_PEM, process.env.KEYFRAMEBOT_WEBHOOK_SECRET);
}
exports.createBot = createBot;

//# sourceMappingURL=keyframebot.js.map
