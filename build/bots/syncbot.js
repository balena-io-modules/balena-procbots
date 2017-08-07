"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const procbot_1 = require("../framework/procbot");
const datahub_1 = require("../utils/datahubs/datahub");
class SyncBot extends procbot_1.ProcBot {
    constructor(name = 'SyncBot') {
        super(name);
        const dataHub = datahub_1.createDataHub(process.env.SYNCBOT_DATAHUB_SERVICE, JSON.parse(process.env.SYNCBOT_DATAHUB_CONSTRUCTOR));
        const messageListener = this.addServiceListener('messenger', {
            dataHub,
            subServices: JSON.parse(process.env.SYNCBOT_LISTENER_CONSTRUCTORS),
        });
        if (!messageListener) {
            throw new Error('Could not create Message Listener.');
        }
        const mappings = JSON.parse(process.env.SYNCBOT_MAPPINGS);
        for (const mapping of mappings) {
            let priorFlow = null;
            for (const focusFlow of mapping) {
                if (priorFlow) {
                    messageListener.registerEvent({
                        events: ['message'],
                        listenerMethod: this.createRouter(priorFlow, focusFlow),
                        name: `${priorFlow.service}.${priorFlow.flow}=>${focusFlow.service}.${focusFlow.flow}`,
                    });
                    messageListener.registerEvent({
                        events: ['message'],
                        listenerMethod: this.createRouter(focusFlow, priorFlow),
                        name: `${focusFlow.service}.${focusFlow.flow}=>${priorFlow.service}.${priorFlow.flow}`,
                    });
                }
                priorFlow = focusFlow;
            }
        }
    }
    createRouter(from, to) {
        return (_registration, event) => {
            if (from.service === event.rawEvent.source.service && from.flow === event.rawEvent.source.flow) {
                const transmitMessage = {
                    details: event.rawEvent.details,
                    source: event.rawEvent.source,
                    target: {
                        flow: to.flow,
                        service: to.service,
                        user: this.getEquivalentUsername(from.service, to.service, event.rawEvent.source.user)
                    }
                };
                console.log(transmitMessage);
            }
            return Promise.resolve();
        };
    }
    getEquivalentUsername(from, to, username) {
        const lookupString = process.env.SYNCBOT_ACCOUNTS_WITH_DIFFERING_USERNAMES || '[]';
        const lookups = JSON.parse(lookupString);
        for (const lookup of lookups) {
            if (lookup[from] === username && lookup[to]) {
                return lookup[to];
            }
        }
        return username;
    }
}
exports.SyncBot = SyncBot;
function createBot() {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=syncbot.js.map
