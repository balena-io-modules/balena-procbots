"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const path = require("path");
const service_utilities_1 = require("./service-utilities");
class FlowdockService extends service_utilities_1.ServiceUtilities {
    connect(data) {
        this.session = new flowdock_1.Session(data.token);
        this.org = data.organization;
    }
    emitData(context) {
        return new Promise((resolve, reject) => {
            this.session.on('error', reject);
            this.session._request(context.method, context.path, context.payload, (error, response) => {
                this.session.removeListener('error', reject);
                if (error) {
                    reject(error);
                }
                else {
                    resolve(response);
                }
            });
        });
    }
    startListening() {
        this.session.flows((error, flows) => {
            if (error) {
                throw error;
            }
            const flowIdToFlowName = {};
            for (const flow of flows) {
                flowIdToFlowName[flow.id] = flow.parameterized_name;
            }
            const stream = this.session.stream(Object.keys(flowIdToFlowName));
            stream.on('message', (message) => {
                this.queueData({
                    cookedEvent: {
                        context: message.thread_id,
                        flow: flowIdToFlowName[message.flow],
                        event: message.event,
                    },
                    rawEvent: message,
                    source: FlowdockService._serviceName,
                });
            });
        });
        this.expressApp.get(`/${FlowdockService._serviceName}/`, (_formData, response) => {
            response.sendStatus(200);
        });
    }
    verify() {
        return true;
    }
    get serviceName() {
        return FlowdockService._serviceName;
    }
    get apiHandle() {
        return {
            flowdock: this.session
        };
    }
}
FlowdockService._serviceName = path.basename(__filename.split('.')[0]);
exports.FlowdockService = FlowdockService;
function createServiceListener(data) {
    return new FlowdockService(data, true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new FlowdockService(data, false);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=flowdock.js.map
