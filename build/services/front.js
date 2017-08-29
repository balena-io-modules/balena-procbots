"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const front_sdk_1 = require("front-sdk");
const path = require("path");
const service_utilities_1 = require("./service-utilities");
class FrontService extends service_utilities_1.ServiceUtilities {
    constructor(data, listen) {
        super();
        this.session = new front_sdk_1.Front(data.token);
        if (listen) {
            this.expressApp.post('/front-dev-null', (_formData, response) => {
                response.sendStatus(200);
            });
            this.expressApp.post(`/${FrontService._serviceName}/`, (formData, response) => {
                this.queueData({
                    context: formData.body.conversation.id,
                    event: formData.body.type,
                    cookedEvent: {},
                    rawEvent: formData.body,
                    source: FrontService._serviceName,
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
    return new FrontService(data, true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new FrontService(data, false);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=front.js.map
