"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const translator_1 = require("./translator");
class DiscourseTranslator extends translator_1.MessageTranslator {
    constructor(data) {
        super();
        this.connectionDetails = data;
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
exports.DiscourseTranslator = DiscourseTranslator;
function createTranslator(data) {
    return new DiscourseTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=discourse.js.map
