"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const datahub_1 = require("./datahub");
class SimpleDataHub {
    constructor(values) {
        this.values = new Map();
        _.forEach(values, (value, key) => {
            this.values.set(key, value);
        });
    }
    fetchValue(user, service, key) {
        const index = `${user}_${service}_${key}`.toLowerCase();
        const value = this.values.get(index);
        if (value) {
            return Promise.resolve(value);
        }
        return Promise.reject(new datahub_1.DataHubError(0, `${index} not found.`));
    }
}
exports.SimpleDataHub = SimpleDataHub;
function createDataHub(values) {
    return new SimpleDataHub(values);
}
exports.createDataHub = createDataHub;

//# sourceMappingURL=simple.js.map
