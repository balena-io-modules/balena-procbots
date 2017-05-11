"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const message_service_1 = require("./message-service");
class FlowdockService extends message_service_1.MessageService {
    constructor() {
        super(...arguments);
        this.flowIdToFlowName = new Map();
    }
    fetchThread(event, filter) {
        if (event.source !== this.serviceName) {
            return Promise.reject(new Error('Cannot get flowdock thread from non-flowdock event'));
        }
        return new Promise((resolve, reject) => {
            const keywords = filter.source.match(/(\w+)/g);
            const options = keywords === null ? {} : { search: keywords.join(' ') };
            const org = process.env.FLOWDOCK_ORGANIZATION_PARAMETERIZED_NAME;
            const room = event.sourceIds.room;
            const thread = event.sourceIds.thread;
            FlowdockService.session.get(`/flows/${org}/${room}/threads/${thread}/messages`, options, (error, result) => {
                if (error) {
                    reject(error);
                }
                else if (result) {
                    resolve(_.map(result, (value) => {
                        return value.content;
                    }).filter((value) => {
                        const match = value.match(filter);
                        return match !== null && match.length > 0;
                    }));
                }
                else {
                    reject(new Error('Something weird happened in the flowdock SDK'));
                }
            });
        });
    }
    fetchPrivateMessages(event, filter) {
        if (event.source !== this.serviceName) {
            return Promise.reject(new Error('Cannot get flowdock thread from non-flowdock event'));
        }
        return new Promise((resolve, reject) => {
            const keywords = filter.source.match(/(\w+)/g);
            const options = keywords === null ? {} : { search: keywords.join(' ') };
            FlowdockService.session.get(`/private/${event.sourceIds.user}/messages`, options, (error, result) => {
                if (error) {
                    reject(error);
                }
                else if (result) {
                    resolve(_
                        .map(result, (value) => {
                        return value.content;
                    })
                        .filter((value) => {
                        const match = value.match(filter);
                        return match !== null && match.length > 0;
                    }));
                }
                else {
                    reject(new Error('Something weird happened in the flowdock SDK'));
                }
            });
        });
    }
    activateMessageListener() {
        FlowdockService.session.flows((error, flows) => {
            if (error) {
                throw error;
            }
            const ids = [];
            for (const flow of flows) {
                ids.push(flow.id);
                this.flowIdToFlowName.set(flow.id, flow.parameterized_name);
            }
            const stream = FlowdockService.session.stream(ids);
            stream.on('message', (message) => {
                if (message.event === 'message') {
                    this.queueEvent({
                        data: {
                            cookedEvent: {
                                context: message.thread_id,
                                flow: this.flowIdToFlowName.get(message.flow),
                                type: message.event,
                            },
                            rawEvent: message,
                            source: this.serviceName,
                        },
                        workerMethod: this.handleEvent,
                    });
                }
            });
        });
        message_service_1.MessageService.app.get(`/${this.serviceName}/`, (_formData, response) => {
            response.send('ok');
        });
    }
    getWorkerContextFromMessage(event) {
        return event.data.cookedEvent.context;
    }
    getEventTypeFromMessage(event) {
        return event.cookedEvent.type;
    }
    sendMessage(body) {
        const org = process.env.FLOWDOCK_ORGANIZATION_PARAMETERIZED_NAME;
        const token = new Buffer(process.env.FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN).toString('base64');
        const requestOpts = {
            body,
            headers: {
                'Authorization': `Basic ${token}`,
                'X-flowdock-wait-for-message': true,
            },
            json: true,
            url: `https://api.flowdock.com/flows/${org}/${body.flow}/messages/`,
        };
        return request.post(requestOpts).then((resData) => {
            return {
                response: {
                    ids: {
                        message: resData.id,
                        thread: resData.thread_id,
                    }
                },
                source: this.serviceName,
            };
        });
    }
    get serviceName() {
        return FlowdockService._serviceName;
    }
    get apiHandle() {
        return {
            flowdock: FlowdockService.session
        };
    }
}
FlowdockService.session = new flowdock_1.Session(process.env.FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN);
FlowdockService._serviceName = path.basename(__filename.split('.')[0]);
exports.FlowdockService = FlowdockService;
function createServiceListener() {
    return new FlowdockService(true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter() {
    return new FlowdockService(false);
}
exports.createServiceEmitter = createServiceEmitter;
function createMessageService() {
    return new FlowdockService(false);
}
exports.createMessageService = createMessageService;

//# sourceMappingURL=flowdock.js.map
