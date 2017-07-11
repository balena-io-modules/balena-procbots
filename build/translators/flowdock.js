"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flowdock_1 = require("flowdock");
const translator_1 = require("./translator");
class FlowdockTranslator extends translator_1.MessageTranslator {
    constructor(data) {
        super();
        this.session = new flowdock_1.Session(data.token);
        this.org = data.organization;
    }
    dataIntoMessage(_data) {
        throw new Error('Method not implemented.');
    }
    messageIntoEmit(_message) {
        throw new Error('Method not implemented.');
    }
    eventIntoEvents(_eventName) {
        throw new Error('Method not implemented.');
    }
}
exports.FlowdockTranslator = FlowdockTranslator;
function createTranslator(data) {
    return new FlowdockTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
