"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
const resin = require('resin-sdk')();
const jwtDecode = require('jwt-decode');
const DeployKeyframePath = '/deploykeyframe';
class VersionBot extends procbot_1.ProcBot {
    constructor(integration, name, pemString, webhook) {
        super(name);
        this.lintKeyframe = (_registration, event) => {
            const pr = event.cookedEvent.data.pull_request;
            const head = event.cookedEvent.data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            const prNumber = pr.number;
            this.logger.log(logger_1.LogLevel.INFO, `Linting ${owner}/${repo}#${prNumber} keyframe for issues`);
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    path: 'index.js',
                    ref: pr.head.ref
                },
                method: this.githubApi.repos.getContent
            }).then((keyframeEncoded) => {
                if (keyframeEncoded.encoding !== 'base64') {
                    this.reportError({
                        brief: `${process.env.KEYFRAMEBOT_NAME} Keyframe encoding error in ${owner}/${repo}#${pr.number}`,
                        message: `${process.env.KEYFRAMEBOT_NAME} failed to decode the Keyframe.`,
                        number: pr.number,
                        owner,
                        repo
                    });
                }
                const keyframe = Buffer.from(keyframeEncoded.content, 'base64').toString();
                const baseSHA = pr.base.sha;
                const headSHA = pr.head.sha;
                return Promise.resolve('updated keyframe data...');
            }).then((keyframeChanges) => {
                console.log(keyframeChanges);
                console.log(`${owner}/${repo}#${prNumber}`);
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        number: prNumber,
                        body: `This keyframe will make the following changes:\n${keyframeChanges}`
                    },
                    method: this.githubApi.issues.createComment
                });
            });
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
exports.VersionBot = VersionBot;
function createBot() {
    if (!(process.env.KEYFRAMEBOT_NAME && process.env.KEYFRAMEBOT_INTEGRATION_ID &&
        process.env.KEYFRAMEBOT_PEM && process.env.KEYFRAMEBOT_WEBHOOK_SECRET)) {
        throw new Error(`'KEYFRAMEBOT_NAME', 'KEYFRAMEBOT_INTEGRATION_ID', 'KEYFRAMEBOT_PEM' and ` +
            `'KEYFRAMEBOT_WEBHOOK_SECRET environment variables need setting`);
    }
    return new VersionBot(process.env.KEYFRAMEBOT_INTEGRATION_ID, process.env.KEYFRAMEBOT_NAME, process.env.KEYFRAMEBOT_PEM, process.env.KEYFRAMEBOT_WEBHOOK_SECRET);
}
exports.createBot = createBot;

//# sourceMappingURL=keyframebot.js.map
