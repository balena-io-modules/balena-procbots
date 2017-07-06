"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypedError = require("typed-error");
class TranslatorError extends TypedError {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.TranslatorError = TranslatorError;
function createTranslator(name, data, hubs) {
    return require(`./${name}`).createTranslator(data, hubs);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=translator.js.map
