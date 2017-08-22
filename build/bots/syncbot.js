"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const messenger_1 = require("../services/messenger");
const datahub_1 = require("../services/messenger/datahubs/datahub");
const logger_1 = require("../utils/logger");
class SyncBot extends procbot_1.ProcBot {
    static makeRouter(from, to, messenger, logger) {
        return (_registration, event) => {
            const data = event.cookedEvent;
            if (from.service === data.source.service &&
                from.flow === data.source.flow &&
                data.details.genesis !== 'system') {
                const text = data.details.text;
                logger.log(logger_1.LogLevel.INFO, `---> Heard '${text}' on ${from.service}.`);
                return SyncBot.readConnectedThread(to, messenger, data)
                    .then(() => {
                    SyncBot.createThreadAndConnect(to, messenger, data)
                        .then(() => {
                        logger.log(logger_1.LogLevel.INFO, `---> Emitted '${text}' to ${to.service}.`);
                    });
                });
            }
            return Promise.resolve();
        };
    }
    static readConnectedThread(to, messenger, data) {
        const readConnection = {
            action: 2,
            details: data.details,
            hub: {
                username: process.env.SYNCBOT_NAME,
            },
            source: data.source,
            target: {
                flow: to.flow,
                service: to.service,
                username: process.env.SYNCBOT_NAME,
            },
        };
        return messenger.sendData({
            contexts: {
                messenger: readConnection,
            },
            source: 'syncbot',
        });
    }
    static createThreadAndConnect(to, messenger, data) {
        const createThread = {
            action: 0,
            details: data.details,
            hub: {
                username: data.source.username,
            },
            source: data.source,
            target: {
                flow: to.flow,
                service: to.service,
                username: data.source.username,
            },
        };
        const createConnections = {
            action: 1,
            details: {
                genesis: 'system',
                hidden: true,
                internal: true,
                text: 'This ticket is mirrored in '
            },
            hub: {
                username: process.env.SYNCBOT_NAME,
            },
            source: {
                message: 'duff',
                thread: 'duff',
                flow: 'duff',
                service: 'system',
                username: 'duff',
            },
            target: {
                flow: 'duff',
                service: 'duff',
                username: process.env.SYNCBOT_NAME,
                thread: 'duff'
            }
        };
        return messenger.sendData({
            contexts: {
                messenger: createThread,
            },
            source: 'syncbot',
        }).then((emitResponse) => {
            const response = emitResponse.response;
            if (response) {
                const connectTarget = _.cloneDeep(createConnections);
                connectTarget.target = {
                    flow: data.source.flow,
                    service: data.source.service,
                    username: process.env.SYNCBOT_NAME,
                    thread: data.source.thread,
                };
                connectTarget.details.text += `[${createThread.target.service} thread ${response.thread}](${response.url})`;
                const sourceDetails = data.source;
                const connectSource = _.cloneDeep(createConnections);
                connectSource.target = {
                    flow: createThread.target.flow,
                    service: createThread.target.service,
                    username: process.env.SYNCBOT_NAME,
                    thread: response.thread,
                };
                connectSource.details.text += `[${sourceDetails.service} thread ${sourceDetails.thread}](${sourceDetails.url})`;
                return Promise.all([
                    messenger.sendData({ contexts: { messenger: connectTarget }, source: 'syncbot' }),
                    messenger.sendData({ contexts: { messenger: connectSource }, source: 'syncbot' }),
                ]).return(emitResponse);
            }
            return Promise.resolve(emitResponse);
        });
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
