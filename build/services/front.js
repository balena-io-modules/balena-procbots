"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const front_sdk_1 = require("front-sdk");
const _ = require("lodash");
const path = require("path");
const logger_1 = require("../utils/logger");
class FrontService {
    constructor(constObj) {
        this._serviceName = path.basename(__filename.split('.')[0]);
        this.eventTriggers = [];
        this.logger = new logger_1.Logger();
        this.handleFrontEvent = (event) => {
            console.log(event);
            return Promise.map(this.eventTriggers, (registration) => {
                if (_.includes(registration.events, event.cookedEvent.type)) {
                    return registration.listenerMethod(registration, event)
                        .catch((err) => {
                        this.logger.alert(logger_1.AlertLevel.ERROR, 'Error thrown in main event/label filter loop:' +
                            err.message);
                    });
                }
            }).return();
        };
        const emitterConstructor = constObj;
        this.apiKey = emitterConstructor.apiKey;
        this.frontSDK = new front_sdk_1.Front(this.apiKey);
    }
    sendData(data) {
        const emitContext = _.pickBy(data.contexts, (_val, key) => {
            return key === this._serviceName;
        });
        const flowdockContext = emitContext.front;
        return flowdockContext.method(flowdockContext.data).then((result) => {
            return {
                response: result,
                source: this._serviceName
            };
        }).catch((err) => {
            console.log(data.contexts.front);
            return {
                err,
                source: this._serviceName
            };
        });
    }
    get apiHandle() {
        return {
            front: this.frontSDK
        };
    }
    get serviceName() {
        return this._serviceName;
    }
}
exports.FrontService = FrontService;
function createServiceEmitter(constObj) {
    return new FrontService(constObj);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=front.js.map
