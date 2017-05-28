"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const procbot_1 = require("../framework/procbot");
const Fortunes = [
    'Great thoughts come from the heart. Your brain is on strike.',
    'People in your surroundings will be more cooperative than usual. Bring money.',
    'Your life will be filled with magical moments. Also, chocolate.',
    'Use your instincts now. RUN!',
    'The energy is within you. Money is Coming!',
    'Darkness is only succesful when there is no light. Don\'t forget about light!',
    'Encourage your peers. To write ProcBots.',
    'The man on the top of the mountain did not fall there. Though he may be out of bottled oxygen.',
];
class FortuneBot extends procbot_1.ProcBot {
    constructor(integration, name, pemString, webhook) {
        super(name);
        this.tellFortune = (_registration, event) => {
            const issueEvent = event.cookedEvent.data;
            const owner = issueEvent.repository.owner.login;
            const repo = issueEvent.repository.name;
            const issueNumber = issueEvent.issue.number;
            return this.githubCall({
                data: {
                    number: issueNumber,
                    owner,
                    repo,
                },
                method: this.githubApi.issues.getComments
            }).then((comments) => {
                if (comments.length > 0) {
                    const comment = comments[comments.length - 1];
                    const author = comment.user.login;
                    const body = comment.body;
                    if (body.match(/fortune me, baby!/i)) {
                        const fortune = Fortunes[Math.floor(Math.random() * Fortunes.length)];
                        const newBody = `@${author}: ${fortune}`;
                        return this.githubCall({
                            data: {
                                body: newBody,
                                number: issueNumber,
                                owner,
                                repo,
                            },
                            method: this.githubApi.issues.createComment
                        });
                    }
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
            path: '/fortunes',
            port: 1234,
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
        if (!ghListener || !ghEmitter) {
            throw new Error('Could not get all services');
        }
        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;
        this.githubApi = ghEmitter.apiHandle.github;
        ghListener.registerEvent({
            events: ['issue_comment'],
            listenerMethod: this.tellFortune,
            name: 'TellUserFortune',
        });
    }
    githubCall(context) {
        const request = {
            contexts: {
                github: context
            },
            source: process.env.VERSIONBOT_NAME
        };
        return this.dispatchToEmitter(this.githubEmitterName, request).then((data) => {
            if (data.err) {
                const ghError = JSON.parse(data.err.message);
                throw new Error(ghError.message);
            }
            return data.response;
        });
    }
}
exports.FortuneBot = FortuneBot;
function createBot() {
    if (!(process.env.FORTUNEBOT_NAME && process.env.FORTUNEBOT_INTEGRATION_ID &&
        process.env.FORTUNEBOT_PEM && process.env.FORTUNEBOT_WEBHOOK_SECRET)) {
        throw new Error('Not all relevant evnvars set');
    }
    return new FortuneBot(process.env.FORTUNEBOT_INTEGRATION_ID, process.env.FORTUNEBOT_NAME, process.env.FORTUNEBOT_PEM, process.env.FORTUNEBOT_WEBHOOK_SECRET);
}
exports.createBot = createBot;

//# sourceMappingURL=fortunebot.js.map
