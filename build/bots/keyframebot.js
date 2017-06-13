"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
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
            return Promise.resolve();
        };
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/keyframehooks',
            port: 7788,
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
        this.githubApi = ghEmitter.apiHandle.github;
        if (!this.githubApi) {
            throw new Error('No Github API instance found');
        }
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
