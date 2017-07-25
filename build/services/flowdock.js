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
        this.receivedPostIds = new Set();
        this.makeGeneric = (data) => {
            const org = this.data.organization;
            const flow = data.cookedEvent.flow;
            const initialMessageID = data.rawEvent.thread.initial_message;
            const tagFilter = (tag) => {
                return !/^:/.test(tag);
            };
            return this.fetchFromSession(`/flows/${org}/${flow}/messages/${initialMessageID}`)
                .then((initialMessage) => {
                if (data.rawEvent.tags.filter(tagFilter).length > 0) {
                    return this.sendPayload({
                        endpoint: {
                            method: 'PUT',
                            token: this.data.token,
                            url: `https://api.flowdock.com/flows/${org}/${flow}/messages/${initialMessageID}`
                        },
                        payload: {
                            tags: _.concat(data.rawEvent.tags, initialMessage.tags).filter(tagFilter),
                        },
                    }).then(() => {
                        return initialMessage;
                    });
                }
                return initialMessage;
            })
                .then((initialMessage) => {
                const emojiMetadata = messenger_1.Messenger.extractMetadata(data.rawEvent.content, 'emoji');
                const charMetadata = messenger_1.Messenger.extractMetadata(data.rawEvent.content, 'char');
                const compiledMetadata = {
                    genesis: emojiMetadata.genesis || charMetadata.genesis || data.source,
                    hidden: emojiMetadata.hidden && charMetadata.hidden,
                    content: emojiMetadata.genesis ? emojiMetadata.content : charMetadata.content,
                };
                const titleAndText = compiledMetadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
                const thread = data.rawEvent.thread_id;
                const userId = data.rawEvent.user;
                const first = data.rawEvent.id === data.rawEvent.thread.initial_message;
                const returnValue = {
                    action: messenger_types_1.MessengerAction.Create,
                    first,
                    genesis: compiledMetadata.genesis,
                    hidden: compiledMetadata.hidden,
                    source: data.source,
                    sourceIds: {
                        message: data.rawEvent.id,
                        flow,
                        thread,
                        url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
                        user: 'duff',
                    },
                    tags: _.concat(data.rawEvent.tags, initialMessage.tags).filter(tagFilter),
                    text: first && titleAndText ? titleAndText[2] : compiledMetadata.content,
                    title: first && titleAndText ? titleAndText[1] : undefined,
                };
                if (data.rawEvent.external_user_name) {
                    returnValue.sourceIds.user = data.rawEvent.external_user_name;
                    return returnValue;
                }
                return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
                    .then((user) => {
                    returnValue.sourceIds.user = user.nick;
                    return returnValue;
                });
            });
        };
        this.makeSpecific = (data) => {
            const lengthLimit = 8096;
            const titleText = data.toIds.thread ? '' : data.title + '\n--\n';
            const footerText = messenger_1.Messenger.stringifyMetadata(data, 'emoji');
            let trimText = '\n\n`... about xx% shown.`';
            const trimmedText = data.text.substr(0, lengthLimit - titleText.length - trimText.length - footerText.length);
            trimText = trimText.replace('xx', Math.floor((100 * trimmedText.length) / data.text.length).toString(10));
            const bodyText = (titleText.length + data.text.length + footerText.length) < lengthLimit
                ? data.text
                : trimmedText + trimText;
            const org = this.data.organization;
            const flow = data.toIds.flow;
            return new Promise((resolve) => {
                resolve({
                    endpoint: {
                        method: 'POST',
                        token: data.toIds.token,
                        url: `https://api.flowdock.com/flows/${org}/${flow}/messages/`,
                    },
                    meta: {
                        flow,
                        org,
                    },
                    payload: {
                        content: `${titleText}${bodyText}${footerText}`,
                        event: 'message',
                        external_user_name: data.toIds.token === this.data.token ? data.toIds.user.substring(0, 16) : undefined,
                        tags: data.first ? data.tags : undefined,
                        thread_id: data.toIds.thread,
                    },
                });
            });
        };
        this.makeTagUpdate = (data) => {
            const topicId = data.toIds.thread;
            if (!topicId) {
                throw new Error('Cannot update tags without specifying thread');
            }
            const org = this.data.organization;
            const flow = data.toIds.flow;
            return this.fetchFromSession(`/flows/${org}/${flow}/threads/${topicId}`).then((threadObj) => {
                return {
                    endpoint: {
                        method: 'PUT',
                        token: data.toIds.token,
                        url: `https://api.flowdock.com/flows/${org}/${flow}/messages/${threadObj.initial_message}`,
                    },
                    payload: {
                        tags: data.tags ? data.tags : [],
                    },
                };
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
                    if (message.event === 'message' && !this.receivedPostIds.has(message.id)) {
                        this.receivedPostIds.add(message.id);
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
            messenger_1.Messenger.expressApp.get(`/${FlowdockService._serviceName}/`, (_formData, response) => {
                response.sendStatus(200);
            });
        };
        this.sendPayload = (data) => {
            const token = new Buffer(data.endpoint.token).toString('base64');
            const requestOpts = {
                body: data.payload,
                headers: {
                    Authorization: `Basic ${token}`,
                    'X-flowdock-wait-for-message': true,
                },
                json: true,
                method: data.endpoint.method,
                url: data.endpoint.url,
            };
            return request(requestOpts).then((resData) => {
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
                    return eachUser.nick.toLowerCase() === username.toLowerCase();
                });
                if (matchingUsers.length === 1) {
                    return (matchingUsers[0].id);
                }
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
