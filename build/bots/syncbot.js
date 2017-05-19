"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const messenger_1 = require("../services/messenger");
const messenger_types_1 = require("../services/messenger-types");
const logger_1 = require("../utils/logger");
class SyncBot extends procbot_1.ProcBot {
    constructor(name = 'SyncBot') {
        super(name);
        this.messengers = new Map();
        const mappings = JSON.parse(process.env.SYNCBOT_MAPPINGS);
        for (const mapping of mappings) {
            let priorFlow = null;
            for (const focusFlow of mapping) {
                if (priorFlow) {
                    this.register(priorFlow, focusFlow);
                    this.register(focusFlow, priorFlow);
                }
                priorFlow = focusFlow;
            }
        }
    }
    register(from, to) {
        try {
            const fromConstructor = JSON.parse(process.env[`SYNCBOT_${from.service.toUpperCase()}_CONSTRUCTOR_OBJECT`]);
            const toConstructor = JSON.parse(process.env[`SYNCBOT_${to.service.toUpperCase()}_CONSTRUCTOR_OBJECT`]);
            this.addServiceListener(from.service, fromConstructor);
            this.addServiceEmitter(from.service, fromConstructor);
            const listener = this.getListener(from.service);
            this.addServiceEmitter(to.service, toConstructor);
            if (listener) {
                listener.registerEvent({
                    events: [this.getMessageService(from.service, fromConstructor).translateEventName('message')],
                    listenerMethod: this.createRouter(from, to),
                    name: `${from.service}:${from.flow}=>${to.service}:${to.flow}`,
                });
            }
        }
        catch (error) {
            this.logger.log(logger_1.LogLevel.WARN, `Problem creating link from ${from.service} to ${to.service}: ${error.message}`);
        }
    }
    createRouter(from, to) {
        return (_registration, data) => {
            return this.getMessageService(from.service).makeGeneric(data).then((generic) => {
                if (generic.sourceIds.flow === from.flow
                    && _.intersection([generic.source, generic.genesis], ['system', to.service]).length === 0) {
                    const event = messenger_1.Messenger.initInterimContext(generic, to.service, { flow: to.flow });
                    return this.useConnected(event, 'thread')
                        .then(() => {
                        this.useProvided(event, 'user')
                            .then(() => this.useHubOrGeneric(event, 'token'))
                            .then(() => this.create(event))
                            .then(() => this.logSuccess(event))
                            .catch((error) => this.handleError(error, event));
                    })
                        .catch(() => {
                        this.useProvided(event, 'user')
                            .then(() => this.useHubOrGeneric(event, 'token'))
                            .then(() => this.create(event))
                            .then(() => this.createConnection(event, 'thread'))
                            .then(() => this.logSuccess(event))
                            .catch((error) => this.handleError(error, event));
                    });
                }
                return Promise.resolve();
            });
        };
    }
    handleError(error, event) {
        this.logger.log(logger_1.LogLevel.WARN, error.message);
        this.logger.log(logger_1.LogLevel.WARN, JSON.stringify(event));
        const fromEvent = {
            action: messenger_types_1.MessengerAction.Create,
            first: false,
            genesis: 'system',
            hidden: true,
            source: 'system',
            sourceIds: {
                flow: '',
                message: '',
                thread: '',
                user: '',
            },
            text: `${event.to} reports \`${error.message}\``,
            to: event.source,
            toIds: {
                flow: event.sourceIds.flow,
                thread: event.sourceIds.thread,
            },
        };
        this.useSystem(fromEvent, 'user')
            .then(() => this.useSystem(fromEvent, 'token'))
            .then(() => this.create(fromEvent))
            .then(() => this.logSuccess(fromEvent))
            .catch((err) => this.logError(err, event));
    }
    getMessageService(key, data) {
        const retrieved = this.messengers.get(key);
        if (retrieved) {
            return retrieved;
        }
        const service = require(`../services/${key}`);
        const created = service.createMessageService(data);
        this.messengers.set(key, created);
        return created;
    }
    getDataHub(key, data) {
        if (!this.hub) {
            const service = require(`../services/${key}`);
            this.hub = service.createDataHub(data);
        }
        return this.hub;
    }
    createConnection(event, type) {
        const sourceId = event.sourceIds.thread;
        const toId = event.toIds.thread;
        if (!sourceId || !toId) {
            return Promise.reject(new Error(`Could not form ${type} connection`));
        }
        const genericEvent = {
            action: messenger_types_1.MessengerAction.Create,
            first: false,
            genesis: 'system',
            hidden: true,
            source: 'system',
            sourceIds: {
                flow: '',
                message: '',
                thread: '',
                user: '',
            },
            text: 'duff',
            to: 'duff',
            toIds: {},
        };
        const toEvent = _.cloneDeep(genericEvent);
        toEvent.text = `[Connects to ${event.source} ${type} ${sourceId}](${event.sourceIds.url})`;
        toEvent.to = event.to;
        toEvent.toIds = event.toIds;
        const fromEvent = _.cloneDeep(genericEvent);
        fromEvent.text = `[Connects to ${event.to} ${type} ${toId}](${event.toIds.url})`;
        fromEvent.to = event.source;
        fromEvent.toIds = event.sourceIds;
        return Promise.all([
            this.useSystem(fromEvent, 'user')
                .then(() => this.useSystem(fromEvent, 'token'))
                .then(() => this.create(fromEvent))
                .then(() => this.logSuccess(fromEvent)),
            this.useSystem(toEvent, 'user')
                .then(() => this.useSystem(toEvent, 'token'))
                .then(() => this.create(toEvent))
                .then(() => this.logSuccess(toEvent))
        ]).reduce(() => { });
    }
    create(event) {
        return this.getMessageService(event.to).makeSpecific(event).then((specific) => {
            return this.dispatchToEmitter(event.to, {
                contexts: {
                    [event.to]: specific
                },
                source: event.source
            })
                .then((retVal) => {
                event.toIds.message = retVal.response.message;
                event.toIds.thread = retVal.response.thread;
                event.toIds.url = retVal.response.url;
                return retVal.response.message;
            });
        });
    }
    logSuccess(event) {
        const output = { source: event.source, title: event.title, text: event.text, target: event.to };
        this.logger.log(logger_1.LogLevel.INFO, `Synced: ${JSON.stringify(output)}`);
    }
    logError(error, event) {
        this.logger.log(logger_1.LogLevel.WARN, 'v!!!v');
        this.logger.log(logger_1.LogLevel.WARN, error.message);
        this.logger.log(logger_1.LogLevel.WARN, JSON.stringify(event));
        this.logger.log(logger_1.LogLevel.WARN, '^!!!^');
    }
    useHubOrGeneric(event, type) {
        return this.useHub(event, type)
            .catch(() => this.useGeneric(event, type))
            .catchThrow(new Error(`Could not find hub or generic ${type} for ${event.to}`));
    }
    useProvided(event, type) {
        return new Promise((resolve) => {
            if (!event.sourceIds[type]) {
                throw new Error(`Could not find provided ${type} for ${event.to}`);
            }
            event.toIds[type] = event.sourceIds[type];
            resolve(event.toIds[type]);
        });
    }
    useGeneric(event, type) {
        return new Promise((resolve) => {
            const to = event.to;
            const genericAccounts = JSON.parse(process.env.SYNCBOT_GENERIC_AUTHOR_ACCOUNTS);
            if (!genericAccounts[to] || !genericAccounts[to][type]) {
                throw new Error(`Could not find generic ${type} for ${event.to}`);
            }
            event.toIds[type] = genericAccounts[to][type];
            resolve(genericAccounts[to][type]);
        });
    }
    useSystem(event, type) {
        return new Promise((resolve) => {
            const to = event.to;
            const systemAccounts = JSON.parse(process.env.SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS);
            if (!systemAccounts[to] || !systemAccounts[to][type]) {
                throw new Error(`Could not find system ${type} for ${event.to}`);
            }
            event.toIds[type] = systemAccounts[to][type];
            resolve(systemAccounts[to][type]);
        });
    }
    useConnected(event, type) {
        const findBase = `Connects to ${event.to} ${type}`;
        const findId = new RegExp(`${findBase} ([\\w\\d-+\\/=]+)`, 'i');
        const messageService = this.getMessageService(event.source);
        return messageService.fetchNotes(event.sourceIds.thread, event.sourceIds.flow, findId, findBase)
            .then((result) => {
            const ids = result && result.length > 0 && result[0].match(findId);
            if (ids && ids.length > 0) {
                event.toIds.thread = ids[1];
                return ids[1];
            }
            throw new Error(`Could not find connected ${type} for ${event.to}`);
        });
    }
    useHub(event, type) {
        let user = undefined;
        if (event.source === process.env.SYNCBOT_HUB_SERVICE) {
            user = event.sourceIds.user;
        }
        else if (event.to === process.env.SYNCBOT_HUB_SERVICE) {
            user = event.toIds.user;
        }
        if (user) {
            try {
                const hubName = process.env.SYNCBOT_HUB_SERVICE;
                const hubConstructor = JSON.parse(process.env[`SYNCBOT_${hubName.toUpperCase()}_CONSTRUCTOR_OBJECT`]);
                return this.getDataHub(hubName, hubConstructor).fetchValue(user, `${event.to} ${type}`)
                    .then((value) => {
                    event.toIds[type] = value;
                    return value;
                })
                    .catch(() => {
                    throw new Error(`Could not find hub ${type} for ${event.to}`);
                });
            }
            catch (error) {
                return Promise.reject(error);
            }
        }
        else {
            return Promise.reject(new Error(`Could not find hub ${type} for ${event.to}`));
        }
    }
}
exports.SyncBot = SyncBot;
function createBot() {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=syncbot.js.map
