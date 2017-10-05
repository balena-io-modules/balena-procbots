"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypedError = require("typed-error");
var DataHubErrorCode;
(function (DataHubErrorCode) {
    DataHubErrorCode[DataHubErrorCode["ValueNotFound"] = 0] = "ValueNotFound";
})(DataHubErrorCode = exports.DataHubErrorCode || (exports.DataHubErrorCode = {}));
class DataHubError extends TypedError {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.DataHubError = DataHubError;
function createDataHub(name, data) {
    return require(`./${name}`).createDataHub(data);
}
exports.createDataHub = createDataHub;

//# sourceMappingURL=datahub.js.map
