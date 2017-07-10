"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const front_sdk_1 = require("front-sdk");
const translator_1 = require("./translator");
class FrontTranslator extends translator_1.MessageTranslator {
    constructor(data) {
        super();
        this.session = new front_sdk_1.Front(data.token);
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
exports.FrontTranslator = FrontTranslator;
function createTranslator(data) {
    return new FrontTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=front.js.map
