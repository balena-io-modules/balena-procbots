"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const front_sdk_1 = require("front-sdk");
const path = require("path");
const service_utilities_1 = require("./service-utilities");
class FrontService extends service_utilities_1.ServiceUtilities {
    connect(data) {
        this.session = new front_sdk_1.Front(data.token);
    }
    startListening() {
        this.expressApp.post('/front-dev-null', (_formData, response) => {
            response.sendStatus(200);
        });
        this.expressApp.post(`/${FrontService._serviceName}/`, (formData, response) => {
            this.queueData({
                cookedEvent: {
                    context: formData.body.conversation.id,
                    event: formData.body.type,
                },
                rawEvent: formData.body,
                source: FrontService._serviceName,
            });
            response.sendStatus(200);
        });
    }
    verify() {
        return true;
    }
    getEmitter(data) {
        const sessionEndpoints = {
            comment: this.session.comment,
            conversation: this.session.conversation,
            message: this.session.message,
            topic: this.session.topic,
        };
        return sessionEndpoints[data.objectType][data.action];
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
