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
const resin = require('resin-sdk')();
const jwtDecode = require('jwt-decode');
const exec = Promise.promisify(ChildProcess.exec);
const tempMkdir = Promise.promisify(temp_1.track().mkdir);
const tempCleanup = Promise.promisify(temp_1.cleanup);
const fsFileExists = Promise.promisify(FS.stat);
const DeployKeyframePath = '/deploykeyframe';
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
            return tempMkdir(`${repo}-${pr.number}_`).then((tempDir) => {
                fullPath = `${tempDir}${path.sep}`;
                return Promise.mapSeries([
                    `git clone https://${authToken}:${authToken}@github.com/${owner}/${repo} ${fullPath}`,
                    `git checkout ${branchName}`
                ], cliCommand);
            }).then(() => {
                const baseSHA = pr.base.sha;
                const headSHA = pr.head.sha;
                return keyframeControl.lint(baseSHA, headSHA, fullPath);
            }).then((lintResults) => {
                let lintMessage = "Keyframe linted successfully";
                let commentPromise = Promise.resolve();
                if (!lintResults.valid) {
                    lintMessage = "Keyframe linting failed";
                    const flattenedErrors = _.flatten(lintResults.messages);
                    let errorMessage = 'The following errors occurred whilst linting the `Keyframe.yml` file:\n';
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
            const headerToken = req.get('Authorization');
            let valid = true;
            const tokenMatch = headerToken.match(/^token (.*)$/i);
            if (!tokenMatch) {
                res.sendStatus(403);
                return;
            }
            const token = tokenMatch[1];
            return resin.auth.loginWithToken(token).then(() => {
                let decodedToken;
                try {
                    decodedToken = jwtDecode(token);
                }
                catch (_err) {
                    throw new Error('Cannot decode token into JWT object');
                }
                console.log(decodedToken);
                if (!decodedToken.permissions['admin.home']) {
                    res.sendStatus(404);
                    return;
                }
                if (!valid) {
                    res.sendStatus(400);
                    return;
                }
                res.sendStatus(200);
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {},
                    method: this.githubApi.gitdata.getReference
                }).then((reference) => {
                    console.log(reference);
                });
            }).catch((err) => {
                this.logger.log(logger_1.LogLevel.INFO, `Error thrown in keyframe deploy:\n${err}`);
                res.sendStatus(500);
            });
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
