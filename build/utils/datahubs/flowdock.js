"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flowdock_1 = require("flowdock");
class FlowdockDataHub {
    constructor(data) {
        this.session = new flowdock_1.Session(data.token);
        this.organization = data.organization;
    }
    fetchValue(_user, _value) {
        throw new Error();
    }
}
exports.FlowdockDataHub = FlowdockDataHub;
function createTranslator(data) {
    return new FlowdockDataHub(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
