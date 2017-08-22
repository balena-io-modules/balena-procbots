"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const procbot_1 = require("../../../framework/procbot");
class ConfigurationDataHub {
    constructor(prefix) {
        this.prefix = prefix;
    }
    fetchValue(user, service, key) {
        const envVar = `${this.prefix}_${user}_${service}_${key}`.toUpperCase();
        if (process.env[envVar]) {
            return Promise.resolve(process.env[envVar]);
        }
        return Promise.reject(new procbot_1.ProcBotError(2, `${envVar} not found.`));
    }
}
exports.ConfigurationDataHub = ConfigurationDataHub;
function createDataHub(prefix) {
    return new ConfigurationDataHub(prefix);
}
exports.createDataHub = createDataHub;

//# sourceMappingURL=configuration.js.map
