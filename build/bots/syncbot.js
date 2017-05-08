"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
const message_converters_1 = require("../utils/message-converters");
class SyncBot extends procbot_1.ProcBot {
    constructor(name = 'SyncBot') {
        super(name);
        this.messengers = new Map();
        this.rooms = JSON.parse(process.env.SYNCBOT_ROOMS_TO_SYNCHRONISE);
        this.genericAccounts = JSON.parse(process.env.SYNCBOT_GENERIC_AUTHOR_ACCOUNTS);
        this.systemAccounts = JSON.parse(process.env.SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS);
        for (const event of JSON.parse(process.env.SYNCBOT_EVENTS_TO_SYNCHRONISE)) {
            this.register(event.from, event.to, event.event);
        }
    }
    register(from, to, type) {
        this.addServiceListener(from);
        const listener = this.getListener(from);
        this.addServiceEmitter(to);
        if (listener) {
            listener.registerEvent({
                events: [message_converters_1.translateTrigger(type, from)],
                listenerMethod: this.createRouter(from, to),
                name: `${from}_${to}_${type}`,
            });
        }
    }
    createRouter(from, to) {
        return (_registration, data) => {
            const generic = message_converters_1.makeGeneric(from, data);
            if (_.intersection([generic.source, generic.genesis], ['system', to]).length === 0) {
                if (generic.type === 'thread') {
                    return this.handleThread(message_converters_1.initThreadHandleContext(generic, to));
                }
                else if (generic.type === 'message') {
                    return this.handleMessage(message_converters_1.initMessageHandleContext(generic, to));
                }
                return Promise.reject(new Error('Event type not understood'));
            }
            return Promise.resolve();
        };
    }
    handleThread(event) {
        return this.searchPairs(event, 'room')
            .then(() => this.searchPrivateExistingOrGeneric(event, 'user'))
            .then(() => this.searchPrivateOrGeneric(event, 'token'))
            .then(() => this.create(event, 'thread'))
            .then(() => this.createConnection(event, 'thread'))
            .then(() => this.logSuccess(event))
            .catch((error) => this.handleError(error, event));
    }
    handleMessage(event) {
        return this.searchHistory(event, 'thread')
            .then(() => {
            this.searchPairs(event, 'room')
                .then(() => this.searchPrivateExistingOrGeneric(event, 'user'))
                .then(() => this.searchPrivateOrGeneric(event, 'token'))
                .then(() => this.create(event, 'message'))
                .then(() => this.logSuccess(event))
                .catch((error) => this.handleError(error, event));
        })
            .catch(() => { });
    }
    handleError(error, event) {
        const fromEvent = {
            action: 'create',
            genesis: 'system',
            private: true,
            source: 'system',
            sourceIds: {
                message: '',
                room: '',
                thread: '',
                user: '',
            },
            text: error.message,
            to: event.source,
            toIds: {
                room: event.sourceIds.room,
                thread: event.sourceIds.thread,
            },
            type: 'message',
        };
        this.searchSystem(fromEvent, 'user')
            .then(() => this.searchSystem(fromEvent, 'token'))
            .then(() => this.create(fromEvent, 'message'))
            .then(() => this.logSuccess(fromEvent))
            .catch((err) => this.logError(event, err.message));
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
    createConnection(event, type) {
        const sourceId = event.sourceIds[type];
        const toId = event.toIds[type];
        if (!sourceId || !toId) {
            return Promise.reject(new Error(`Could not form ${type} connection`));
        }
        const toEvent = {
            action: 'create',
            genesis: 'system',
            private: true,
            source: 'system',
            sourceIds: {
                message: '',
                room: '',
                thread: '',
                user: '',
            },
            text: `Connects to ${event.source} ${type} ${sourceId}`,
            to: event.to,
            toIds: {
                room: event.toIds.room,
                thread: event.toIds.thread,
            },
            type: 'message',
        };
        const fromEvent = {
            action: 'create',
            genesis: 'system',
            private: true,
            source: 'system',
            sourceIds: {
                message: '',
                room: '',
                thread: '',
                user: '',
            },
            text: `Connects to ${event.to} ${type} ${toId}`,
            to: event.source,
            toIds: {
                room: event.sourceIds.room,
                thread: event.sourceIds.thread,
            },
            type: 'message',
        };
        return Promise.all([
            this.searchSystem(fromEvent, 'user')
                .then(() => this.searchSystem(fromEvent, 'token'))
                .then(() => this.create(fromEvent, 'message')),
            this.searchSystem(toEvent, 'user')
                .then(() => this.searchSystem(toEvent, 'token'))
                .then(() => this.create(toEvent, 'message'))
        ]).reduce(() => { });
    }
    create(event, type) {
        return this.dispatchToEmitter(event.to, {
            contexts: {
                [event.to]: message_converters_1.makeSpecific(event)
            },
            source: event.source
        })
            .then((retVal) => {
            event.toIds[type] = retVal.response.ids[type];
            return retVal.response.ids[type];
        });
    }
    logSuccess(event) {
        this.logger.log(logger_1.LogLevel.INFO, `synced ${event.source}: ${event.text}`);
    }
    logError(event, message) {
        this.logger.log(logger_1.LogLevel.WARN, JSON.stringify(event));
        if (message) {
            this.logger.log(logger_1.LogLevel.WARN, message);
        }
    }
    searchPrivateExistingOrGeneric(event, type) {
        return this.searchPrivate(event, type)
            .catch(() => this.searchExisting(event, type))
            .catch(() => this.searchGeneric(event, type))
            .catchThrow(new Error(`Could not find private, existing or generic ${type} for ${event.to}`));
    }
    searchPrivateOrGeneric(event, type) {
        return this.searchPrivate(event, type)
            .catch(() => this.searchGeneric(event, type))
            .catchThrow(new Error(`Could not find private or generic ${type} for ${event.to}`));
    }
    searchPairs(event, type) {
        return new Promise((resolve) => {
            const from = event.source;
            const to = event.to;
            const id = event.sourceIds[type];
            if (!this.rooms[from] ||
                !this.rooms[from][id] ||
                !this.rooms[from][id][to]) {
                throw new Error(`Could not find paired ${type} for ${event.to}`);
            }
            event.toIds[type] = this.rooms[from][id][to];
            resolve(this.rooms[from][id][to]);
        });
    }
    searchExisting(event, type) {
        return new Promise((resolve) => {
            if (!event.sourceIds[type]) {
                throw new Error(`Could not find existing ${type} for ${event.to}`);
            }
            event.toIds[type] = event.sourceIds[type];
            resolve(event.toIds[type]);
        });
    }
    searchGeneric(event, type) {
        return new Promise((resolve) => {
            const to = event.to;
            if (!this.genericAccounts[to] ||
                !this.genericAccounts[to][type]) {
                throw new Error(`Could not find generic ${type} for ${event.to}`);
            }
            event.toIds[type] = this.genericAccounts[to][type];
            resolve(this.genericAccounts[to][type]);
        });
    }
    searchSystem(event, type) {
        return new Promise((resolve) => {
            const to = event.to;
            if (!this.systemAccounts[to] ||
                !this.systemAccounts[to][type]) {
                throw new Error(`Could not find system ${type} for ${event.to}`);
            }
            event.toIds[type] = this.systemAccounts[to][type];
            resolve(this.systemAccounts[to][type]);
        });
    }
    searchHistory(event, type, attemptsLeft = 3) {
        const findId = new RegExp(`Connects to ${event.to} ${type} ([\\w\\d-+\\/=]+)`, 'i');
        const messageService = this.getMessageService(event.source);
        return messageService.fetchThread(event, findId)
            .then((result) => {
            const ids = result && result.length > 0 && result[0].match(findId);
            if (ids && ids.length > 0) {
                event.toIds[type] = ids[1];
                return ids[1];
            }
            else if (attemptsLeft > 0) {
                return this.searchHistory(event, type, attemptsLeft - 1);
            }
            throw new Error(`Could not find history ${type} for ${event.to}`);
        });
    }
    searchPrivate(event, type) {
        const findValue = new RegExp(`My ${event.to} ${type} is ([\\w\\d-+\\/=]+)`, 'i');
        const messageService = this.getMessageService(event.source);
        return messageService.fetchPrivateMessages(event, findValue)
            .then((result) => {
            const ids = result && result.length > 0 && result[result.length - 1].match(findValue);
            if (ids && ids.length > 1) {
                event.toIds[type] = ids[1];
                return ids[1];
            }
            throw new Error(`Could not find private message ${type} for ${event.to}`);
        });
    }
}
exports.SyncBot = SyncBot;
function createBot() {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=syncbot.js.map
