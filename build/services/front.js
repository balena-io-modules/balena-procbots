"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const front_sdk_1 = require("front-sdk");
const path = require("path");
const service_scaffold_1 = require("./service-scaffold");
class FrontService extends service_scaffold_1.ServiceScaffold {
    constructor(data) {
        super(data);
        this.session = new front_sdk_1.Front(data.token);
        if (data.type === 0) {
            const listenerData = data;
            this.registerHandler('front-dev-null', (_formData, response) => {
                response.sendStatus(200);
            });
            this.registerHandler(listenerData.path || FrontService._serviceName, (formData, response) => {
                this.queueData({
                    context: formData.body.conversation.id,
                    cookedEvent: {},
                    rawEvent: formData.body,
                    source: FrontService._serviceName,
                    type: formData.body.type,
                });
                response.sendStatus(200);
            });
        }
    }
    emitData(context) {
        return context.method(context.data);
    }
    verify(_data) {
        return true;
    }
    get serviceName() {
        return FrontService._serviceName;
    }
    get apiHandle() {
        return {
            front: this.session
        };
    }
}
FrontService._serviceName = path.basename(__filename.split('.')[0]);
exports.FrontService = FrontService;
function createServiceListener(data) {
    return new FrontService(data);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new FrontService(data);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=front.js.map
