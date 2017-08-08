"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const procbot_1 = require("../framework/procbot");
const messenger_1 = require("../services/messenger");
const datahub_1 = require("../utils/datahubs/datahub");
class SyncBot extends procbot_1.ProcBot {
    static getEquivalentUsername(from, to, username) {
        const lookupString = process.env.SYNCBOT_ACCOUNTS_WITH_DIFFERING_USERNAMES || '[]';
        const lookups = JSON.parse(lookupString);
        for (const lookup of lookups) {
            if (lookup[from] === username && lookup[to]) {
                return lookup[to];
            }
        }
        return username;
    }
    static makeRouter(from, to, emitter) {
        return (_registration, event) => {
            if (from.service === event.cookedEvent.source.service && from.flow === event.cookedEvent.source.flow) {
                const hubService = process.env.SYNCBOT_DATAHUB_SERVICE;
                const transmitMessage = {
                    details: event.cookedEvent.details,
                    hub: {
                        service: hubService,
                        user: SyncBot.getEquivalentUsername(from.service, hubService, event.cookedEvent.source.user),
                    },
                    source: event.cookedEvent.source,
                    target: {
                        flow: to.flow,
                        service: to.service,
                        user: SyncBot.getEquivalentUsername(from.service, to.service, event.cookedEvent.source.user),
                    },
                };
                return emitter.sendData({
                    contexts: {
                        messenger: transmitMessage,
                    },
                    source: 'messenger',
                }).then(() => { });
            }
            return Promise.resolve();
        };
    }
    constructor(name = 'SyncBot') {
        super(name);
        const dataHub = datahub_1.createDataHub(process.env.SYNCBOT_DATAHUB_SERVICE, JSON.parse(process.env.SYNCBOT_DATAHUB_CONSTRUCTOR));
        const messenger = new messenger_1.MessengerService({
            dataHub,
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
                        listenerMethod: SyncBot.makeRouter(priorFlow, focusFlow, messenger),
                        name: `${priorFlow.service}.${priorFlow.flow}=>${focusFlow.service}.${focusFlow.flow}`,
                    });
                    messenger.registerEvent({
                        events: ['message'],
                        listenerMethod: SyncBot.makeRouter(focusFlow, priorFlow, messenger),
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
