"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const path = require("path");
const service_scaffold_1 = require("./service-scaffold");
class FlowdockService extends service_scaffold_1.ServiceScaffold {
    constructor(data) {
        super();
        this.session = new flowdock_1.Session(data.token);
        const doNothing = () => { };
        this.session.on('error', doNothing);
        this.org = data.organization;
        if (!data.deaf) {
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
                        context: message.thread_id,
                        cookedEvent: {
                            flow: flowIdToFlowName[message.flow],
                        },
                        type: message.event,
                        rawEvent: message,
                        source: FlowdockService._serviceName,
                    });
                });
            });
            this.expressApp.get(`/${FlowdockService._serviceName}/`, (_formData, response) => {
                response.sendStatus(200);
            });
        }
    }
    emitData(context) {
        return new Promise((resolve, reject) => {
            context.method(context.data.path, context.data.payload, (error, response) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(response);
                }
            });
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
    data.deaf = false;
    return new FlowdockService(data);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    data.deaf = true;
    return new FlowdockService(data);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=flowdock.js.map
