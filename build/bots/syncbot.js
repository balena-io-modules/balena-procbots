"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const procbot_1 = require("../framework/procbot");
class SyncBot extends procbot_1.ProcBot {
    constructor(name = 'SyncBot') {
        super(name);
        const messageListener = this.addServiceListener('messenger', JSON.parse(process.env.SYNCBOT_LISTENER_CREDENTIALS));
        if (!messageListener) {
            throw new Error('Could not create Message Listener.');
        }
        messageListener.registerEvent({
            events: ['message'],
            listenerMethod: console.log.bind(console),
            name: 'consoleLog',
        });
    }
}
exports.SyncBot = SyncBot;
function createBot() {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=syncbot.js.map
