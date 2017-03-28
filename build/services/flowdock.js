"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
class FlowdockService {
    constructor() {
        this._serviceName = path.basename(__filename.split('.')[0]);
    }
    sendData(data) {
        const emitContext = _.pickBy(data.contexts, (_val, key) => {
            return key === this._serviceName;
        });
        const flowdockContext = emitContext.flowdock;
        const requestOpts = {
            body: flowdockContext,
            json: true,
            url: `https://api.flowdock.com/messages/team_inbox/${flowdockContext.roomId}`,
        };
        return request.post(requestOpts).then((resData) => {
            return {
                response: resData,
                source: this._serviceName
            };
        }).catch((err) => {
            console.log(`FlowdockAdapter failed to post to Flowdock:\n${err.message}`);
            return {
                err,
                source: this._serviceName
            };
        });
    }
    get serviceName() {
        return this._serviceName;
    }
}
exports.FlowdockService = FlowdockService;
function createServiceEmitter() {
    return new FlowdockService();
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=flowdock.js.map
