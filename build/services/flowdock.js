"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const path = require("path");
const logger_1 = require("../utils/logger");
const service_scaffold_1 = require("./service-scaffold");
class FlowdockService extends service_scaffold_1.ServiceScaffold {
    constructor(data) {
        super(data);
        this.postsSynced = new Set();
        this.session = new flowdock_1.Session(data.token);
        this.session.on('error', _.partial(console.log, 'error looking up data from Flowdock.'));
        this.org = data.organization;
        if (data.type === 0) {
            this.session.flows((error, flows) => {
                if (error) {
                    this.logger.alert(logger_1.LogLevel.WARN, `Problem connecting to Flowdock, ${error}`);
                }
                const flowIdToFlowName = {};
                for (const flow of flows) {
                    flowIdToFlowName[flow.id] = flow.parameterized_name;
                }
                const stream = this.session.stream(Object.keys(flowIdToFlowName));
                stream.on('message', (message) => {
                    if (!this.postsSynced.has(message.id)) {
                        this.postsSynced.add(message.id);
                        this.queueData({
                            context: message.thread_id,
                            cookedEvent: {
                                flow: flowIdToFlowName[message.flow],
                            },
                            type: message.event,
                            rawEvent: message,
                            source: FlowdockService._serviceName,
                        });
                    }
                });
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
    return new FlowdockService(data);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new FlowdockService(data);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=flowdock.js.map
