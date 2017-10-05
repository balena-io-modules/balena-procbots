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
                !_.includes(['system', to.service], data.details.genesis)) {
                const text = data.details.text;
                logger.log(logger_1.LogLevel.INFO, `---> Heard '${text.split(/[\r\n]/)[0]}' on ${from.service}.`);
                return SyncBot.readConnectedThread(to, messenger, data)
                    .then((threadDetails) => {
                    const threadId = _.get(threadDetails, 'response.thread', false);
                    if (threadId) {
                        return SyncBot.createComment({
                            service: to.service, flow: to.flow, thread: threadId,
                        }, messenger, data)
                            .then((emitResponse) => {
                            if (emitResponse.err) {
                                return emitResponse;
                            }
                            return {
                                response: {
                                    thread: threadId,
                                },
                                source: emitResponse.source,
                            };
                        });
                    }
                    return SyncBot.createThreadAndConnect(to, messenger, data);
                })
                    .then((response) => {
                    if (response.err) {
                        logger.log(logger_1.LogLevel.WARN, JSON.stringify({ message: response.err.message, data }));
                        return SyncBot.createErrorComment(to, messenger, data, response.err)
                            .return(response);
                    }
                    else {
                        logger.log(logger_1.LogLevel.INFO, `---> Emitted '${text.split(/[\r\n]/)[0]}' to ${to.service}.`);
                    }
                    return response;
                })
                    .then((emitResponse) => {
                    const threadId = _.get(emitResponse, 'response.thread', false);
                    if (threadId && data.details.tags) {
                        return SyncBot.updateTags({
                            service: to.service,
                            flow: to.flow,
                            thread: threadId,
                        }, messenger, data)
                            .return();
                    }
                });
            }
            return Promise.resolve();
        };
    }
    static createErrorComment(to, messenger, data, error) {
        const solution = SyncBot.getErrorSolution(to.service, error.message);
        const fixes = solution.fixes.length > 0 ?
            ` * ${solution.fixes.join('\r\n * ')}` :
            process.env.SYNCBOT_ERROR_UNDOCUMENTED;
        const echoData = {
            details: {
                genesis: to.service,
                handle: process.env.SYNCBOT_NAME,
                hidden: true,
                internal: true,
                tags: data.details.tags,
                text: `${to.service} reports \`${solution.description}\`.\r\n${fixes}\r\n`,
                title: data.details.title,
            },
            source: {
                message: 'duff',
                thread: 'duff',
                service: to.service,
                username: process.env.SYNCBOT_NAME,
                flow: to.flow,
            },
        };
        return SyncBot.createComment(data.source, messenger, echoData);
    }
    static getErrorSolution(service, message) {
        try {
            const solutionMatrix = JSON.parse(process.env.SYNCBOT_ERROR_SOLUTIONS);
            const solutionIdeas = _.get(solutionMatrix, service, {});
            const filteredSolutions = _.filter(solutionIdeas, (_value, pattern) => {
                return new RegExp(pattern).test(message);
            });
            if (filteredSolutions.length > 0) {
                return filteredSolutions[0];
            }
            else {
                return {
                    description: message,
                    fixes: [],
                };
            }
        }
        catch (error) {
            throw new Error('SYNCBOT_ERROR_SOLUTIONS not a valid JSON object of service => { message => resolution }.');
        }
    }
    static updateTags(to, messenger, data) {
        const updateTags = {
            action: 3,
            details: data.details,
            source: data.source,
            target: {
                flow: to.flow,
                service: to.service,
                thread: to.thread,
                username: process.env.SYNCBOT_NAME,
            },
        };
        return messenger.sendData({
            contexts: {
                messenger: updateTags,
            },
            source: 'syncbot',
        });
    }
    static createComment(to, messenger, data) {
        const createComment = {
            action: 1,
            details: data.details,
            source: data.source,
            target: {
                flow: to.flow,
                service: to.service,
                thread: to.thread,
                username: data.source.username,
            },
        };
        return messenger.sendData({
            contexts: {
                messenger: createComment,
            },
            source: 'syncbot',
        });
    }
    static readConnectedThread(to, messenger, data) {
        const readConnection = {
            action: 2,
            details: data.details,
            source: {
                flow: to.flow,
                message: 'duff',
                service: to.service,
                thread: 'duff',
                username: process.env.SYNCBOT_NAME,
            },
            target: {
                flow: data.source.flow,
                service: data.source.service,
                thread: data.source.thread,
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
            source: data.source,
            target: {
                flow: to.flow,
                service: to.service,
                username: data.source.username,
            },
        };
        return messenger.sendData({
            contexts: {
                messenger: createThread,
            },
            source: 'syncbot',
        }).then((emitResponse) => {
            const response = emitResponse.response;
            if (response) {
                const genericConnect = {
                    action: 1,
                    details: {
                        genesis: 'system',
                        handle: process.env.SYNCBOT_NAME,
                        hidden: true,
                        internal: true,
                        tags: data.details.tags,
                        text: 'This is mirrored in ',
                        title: data.details.title,
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
                const updateOriginating = _.cloneDeep(genericConnect);
                updateOriginating.target = {
                    flow: data.source.flow,
                    service: data.source.service,
                    username: process.env.SYNCBOT_NAME,
                    thread: data.source.thread,
                };
                updateOriginating.details.text += `[${createThread.target.service} thread ${response.thread}](${response.url})`;
                const updateCreated = _.cloneDeep(genericConnect);
                updateCreated.target = {
                    flow: createThread.target.flow,
                    service: createThread.target.service,
                    username: process.env.SYNCBOT_NAME,
                    thread: response.thread,
                };
                updateCreated.details.text += `[${data.source.service} thread ${data.source.thread}](${data.source.url})`;
                return Promise.all([
                    messenger.sendData({ contexts: { messenger: updateOriginating }, source: 'syncbot' }),
                    messenger.sendData({ contexts: { messenger: updateCreated }, source: 'syncbot' }),
                ]).return(emitResponse);
            }
            return Promise.resolve(emitResponse);
        });
    }
    static makeDataHubs() {
        let dataHubArray = [];
        try {
            dataHubArray = JSON.parse(process.env.SYNCBOT_DATAHUB_CONSTRUCTORS);
        }
        catch (error) {
            throw new Error('SYNCBOT_DATAHUB_CONSTRUCTORS not a valid JSON array.');
        }
        const dataHubs = _.map(dataHubArray, (constructor, type) => {
            return datahub_1.createDataHub(type, constructor);
        });
        if (dataHubs) {
            return dataHubs;
        }
        throw new Error('Could not create dataHubs.');
    }
    static makeMessenger() {
        let listenerConstructors = [];
        try {
            listenerConstructors = JSON.parse(process.env.SYNCBOT_LISTENER_CONSTRUCTORS);
        }
        catch (error) {
            throw new Error('SYNCBOT_LISTENER_CONSTRUCTORS not a valid JSON array.');
        }
        const messenger = new messenger_1.MessengerService({
            dataHubs: SyncBot.makeDataHubs(),
            server: parseInt(process.env.SYNCBOT_PORT, 10),
            subServices: listenerConstructors,
            type: 0,
        });
        if (messenger) {
            return messenger;
        }
        throw new Error('Could not create Messenger.');
    }
    static makeMappings() {
        try {
            return JSON.parse(process.env.SYNCBOT_MAPPINGS);
        }
        catch (error) {
            throw new Error('SYNCBOT_MAPPINGS not a valid JSON array.');
        }
    }
    constructor(name = 'SyncBot') {
        super(name);
        const logger = new logger_1.Logger();
        const messenger = SyncBot.makeMessenger();
        const mappings = SyncBot.makeMappings();
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
