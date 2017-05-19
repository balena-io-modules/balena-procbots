"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const messenger_1 = require("./messenger");
const messenger_types_1 = require("./messenger-types");
class FlowdockService extends messenger_1.Messenger {
    constructor(data, listen = true) {
        super(listen);
        this.makeGeneric = (data) => {
            return new Promise((resolve) => {
                const metadata = messenger_1.Messenger.extractMetadata(data.rawEvent.content);
                const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
                const flow = data.cookedEvent.flow;
                const thread = data.rawEvent.thread_id;
                const userId = data.rawEvent.user;
                const org = this.data.organization;
                const returnValue = {
                    action: messenger_types_1.MessengerAction.Create,
                    first: data.rawEvent.id === data.rawEvent.thread.initial_message,
                    genesis: metadata.genesis || data.source,
                    hidden: metadata.hidden,
                    source: data.source,
                    sourceIds: {
                        message: data.rawEvent.id,
                        flow,
                        thread,
                        url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
                        user: 'duff',
                    },
                    text: titleAndText ? titleAndText[2] : metadata.content,
                    title: titleAndText ? titleAndText[1] : undefined,
                };
                if (data.rawEvent.external_user_name) {
                    returnValue.sourceIds.user = data.rawEvent.external_user_name;
                    resolve(returnValue);
                }
                else {
                    this.fetchFromSession(`/organizations/${org}/users/${userId}`)
                        .then((user) => {
                        returnValue.sourceIds.user = user.nick;
                        resolve(returnValue);
                    });
                }
            });
        };
        this.makeSpecific = (data) => {
            const titleText = data.first && data.title ? data.title + '\n--\n' : '';
            const org = this.data.organization;
            const flow = data.toIds.flow;
            return new Promise((resolve) => {
                resolve({
                    endpoint: {
                        token: data.toIds.token,
                        url: `https://api.flowdock.com/flows/${org}/${flow}/messages/`,
                    },
                    meta: {
                        flow,
                        org,
                    },
                    payload: {
                        content: messenger_1.Messenger.stringifyMetadata(data) + titleText + data.text,
                        event: 'message',
                        external_user_name: data.toIds.token === this.data.token ? data.toIds.user.substring(0, 16) : undefined,
                        thread_id: data.toIds.thread,
                    },
                });
            });
        };
        this.fetchNotes = (thread, room, filter, search) => {
            const org = this.data.organization;
            return this.fetchFromSession(`/flows/${org}/${room}/threads/${thread}/messages`, search)
                .then((messages) => {
                return _.map(messages, (value) => {
                    return value.content;
                }).filter((value) => {
                    const match = value.match(filter);
                    return (match !== null) && (match.length > 0);
                });
            });
        };
        this.activateMessageListener = () => {
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
                    if (message.event === 'message') {
                        this.queueEvent({
                            data: {
                                cookedEvent: {
                                    context: message.thread_id,
                                    flow: flowIdToFlowName[message.flow],
                                    type: message.event,
                                },
                                rawEvent: message,
                                source: FlowdockService._serviceName,
                            },
                            workerMethod: this.handleEvent,
                        });
                    }
                });
            });
            messenger_1.Messenger.app.get(`/${FlowdockService._serviceName}/`, (_formData, response) => {
                response.sendStatus(200);
            });
        };
        this.sendPayload = (data) => {
            const token = new Buffer(data.endpoint.token).toString('base64');
            const requestOpts = {
                body: data.payload,
                headers: {
                    'Authorization': `Basic ${token}`,
                    'X-flowdock-wait-for-message': true,
                },
                json: true,
                url: data.endpoint.url,
            };
            return request.post(requestOpts).then((resData) => {
                const thread = resData.thread_id;
                const org = data.meta ? data.meta.org : '';
                const flow = data.meta ? data.meta.flow : '';
                const url = data.meta ? `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}` : undefined;
                return {
                    response: {
                        message: resData.id,
                        thread: resData.thread_id,
                        url,
                    },
                    source: FlowdockService._serviceName,
                };
            });
        };
        this.fetchUserId = (username) => {
            return this.fetchFromSession(`/organizations/${this.data.organization}/users`)
                .then((foundUsers) => {
                const matchingUsers = _.filter(foundUsers, (eachUser) => {
                    return eachUser.nick === username;
                });
                if (matchingUsers.length === 1) {
                    return (matchingUsers[0].id);
                }
                return undefined;
            });
        };
        this.fetchFromSession = (path, search) => {
            return new Promise((resolve, reject) => {
                this.session.on('error', reject);
                this.session.get(path, { search }, (_error, result) => {
                    this.session.removeListener('error', reject);
                    if (result) {
                        resolve(result);
                    }
                });
            });
        };
        this.data = data;
        this.session = new flowdock_1.Session(data.token);
    }
    translateEventName(eventType) {
        const equivalents = {
            message: 'message',
        };
        return equivalents[eventType];
    }
    fetchValue(user, key) {
        const findKey = new RegExp(`My ${key} is (\\S+)`, 'i');
        return this.fetchPrivateMessages(user, findKey).then((valueArray) => {
            const value = valueArray[valueArray.length - 1].match(findKey);
            if (value) {
                return value[1];
            }
            throw new Error(`Could not find value $key for $user`);
        });
    }
    fetchPrivateMessages(username, filter) {
        return this.fetchUserId(username)
            .then((userId) => {
            return this.fetchFromSession(`/private/${userId}/messages`)
                .then((fetchedMessages) => {
                return _.filter(fetchedMessages, (message) => {
                    return filter.test(message.content);
                }).map((message) => {
                    return message.content;
                });
            });
        });
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
function createMessageService(data) {
    return new FlowdockService(data, false);
}
exports.createMessageService = createMessageService;
function createDataHub(data) {
    return new FlowdockService(data, false);
}
exports.createDataHub = createDataHub;

//# sourceMappingURL=flowdock.js.map
