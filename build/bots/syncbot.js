"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const messenger_1 = require("../services/messenger");
const datahub_1 = require("../services/messenger/datahubs/datahub");
const logger_1 = require("../utils/logger");
class SyncBot extends procbot_1.ProcBot {
    static makeRouter(from, to, emitter, logger) {
        return (_registration, event) => {
            if (from.service === event.cookedEvent.source.service && from.flow === event.cookedEvent.source.flow) {
                const transmitMessage = {
                    action: 'createThread',
                    details: event.cookedEvent.details,
                    hub: {
                        username: event.cookedEvent.source.username,
                    },
                    source: event.cookedEvent.source,
                    target: {
                        flow: to.flow,
                        service: to.service,
                        username: event.cookedEvent.source.username,
                    },
                };
                return emitter.sendData({
                    contexts: {
                        messenger: transmitMessage,
                    },
                    source: 'syncbot',
                }).then((emitResponse) => {
                    const response = emitResponse.response;
                    if (response) {
                        const genericData = {
                            action: 'createComment',
                            details: {
                                genesis: 'system',
                                hidden: true,
                                internal: true,
                                text: 'This ticket is mirrored in '
                            },
                            hub: {
                                username: 'syncbot',
                            },
                            source: {
                                message: 'duff',
                                thread: 'duff',
                                flow: 'duff',
                                service: 'system',
                                username: 'syncbot',
                            },
                            target: {
                                flow: 'duff',
                                service: 'duff',
                                username: 'syncbot',
                                thread: 'duff'
                            }
                        };
                        const sourceDetails = event.cookedEvent.source;
                        const updateTarget = _.cloneDeep(genericData);
                        updateTarget.target = {
                            flow: to.flow,
                            service: to.service,
                            username: 'syncbot',
                            thread: sourceDetails.thread,
                        };
                        updateTarget.details.text += `[${from.service} thread ${sourceDetails.thread}](${sourceDetails.url})`;
                        emitter.sendData({ contexts: { messenger: updateTarget }, source: 'syncbot' });
                        const updateSource = _.cloneDeep(genericData);
                        updateSource.target = {
                            flow: from.flow,
                            service: from.service,
                            username: 'syncbot',
                            thread: response.thread,
                        };
                        updateSource.details.text += `[${to.service} thread ${response.thread}](${response.url})`;
                        emitter.sendData({ contexts: { messenger: updateSource }, source: 'syncbot' });
                        if (logger) {
                            logger.log(logger_1.LogLevel.INFO, `---> Emitted '${event.cookedEvent.details.text}' to ${to.service}.`);
                        }
                    }
                });
            }
            return Promise.resolve();
        };
    }
    constructor(name = 'SyncBot') {
        super(name);
        const logger = new logger_1.Logger();
        const dataHub = datahub_1.createDataHub(process.env.SYNCBOT_DATAHUB_SERVICE, JSON.parse(process.env.SYNCBOT_DATAHUB_CONSTRUCTOR));
        if (!dataHub) {
            throw new Error('Could not create dataHub.');
        }
        const dataHubs = [
            datahub_1.createDataHub('configuration', 'syncbot'),
            dataHub,
        ];
        const messenger = new messenger_1.MessengerService({
            dataHubs,
            subServices: JSON.parse(process.env.SYNCBOT_LISTENER_CONSTRUCTORS),
        }, true);
        if (!messenger) {
            throw new Error('Could not create Messenger.');
        }
        const mappings = JSON.parse(process.env.SYNCBOT_MAPPINGS);
        for (const mapping of mappings) {
            let priorFlow = null;
            for (const focusFlow of mapping) {
                if (priorFlow) {
                    messenger.registerEvent({
                        events: ['message'],
                        listenerMethod: SyncBot.makeRouter(priorFlow, focusFlow, messenger, logger),
                        name: `${priorFlow.service}.${priorFlow.flow}=>${focusFlow.service}.${focusFlow.flow}`,
                    });
                    messenger.registerEvent({
                        events: ['message'],
                        listenerMethod: SyncBot.makeRouter(focusFlow, priorFlow, messenger, logger),
                        name: `${focusFlow.service}.${focusFlow.flow}=>${priorFlow.service}.${priorFlow.flow}`,
                    });
                }
                priorFlow = focusFlow;
            }
        }
    }
}
exports.SyncBot = SyncBot;
function createBot() {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=syncbot.js.map
