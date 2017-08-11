"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
class ConfigurationDataHub {
    constructor(prefix) {
        this.prefix = prefix;
    }
    fetchValue(user, service, key) {
        const envVar = `${this.prefix}_${user}_${service}_${key}`.toUpperCase();
        if (process.env[envVar]) {
            return Promise.resolve(process.env[envVar]);
        }
        return Promise.reject(new Error('Value not found'));
    }
}
exports.ConfigurationDataHub = ConfigurationDataHub;
function createDataHub(prefix) {
    return new ConfigurationDataHub(prefix);
}
exports.createDataHub = createDataHub;

//# sourceMappingURL=configuration.js.map
