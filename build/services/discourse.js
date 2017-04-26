"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const message_service_1 = require("./message-service");
class DiscourseService extends message_service_1.MessageService {
    constructor() {
        super(...arguments);
        this.topicCache = new Map();
        this.postsSynced = new Set();
    }
    fetchThread(event, filter) {
        if (event.source !== this.serviceName) {
            return Promise.reject(new Error('Cannot get discourse thread from non-discourse event'));
        }
        const getThread = {
            json: true,
            method: 'GET',
            qs: {
                api_key: process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN,
                api_username: process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME,
            },
            uri: `https://${process.env.DISCOURSE_INSTANCE_URL}/t/${event.sourceIds.thread}`,
        };
        return request(getThread).then((thread) => {
            return _.map(thread.post_stream.posts, (item) => {
                return item.cooked;
            }).filter((value) => {
                const match = value.match(filter);
                return match !== null && match.length > 0;
            });
        });
    }
    activateMessageListener() {
        message_service_1.MessageService.app.post(`/${this.serviceName}/`, (formData, response) => {
            if (this.postsSynced.has(formData.body.post.id)) {
                response.send();
            }
            else {
                this.postsSynced.add(formData.body.post.id);
                this.fetchTopic(formData.body.post.topic_id)
                    .then((topic) => {
                    if (formData.body.post.post_number === 1) {
                        const topicEvent = {
                            data: {
                                cookedEvent: {
                                    context: topic.id,
                                    type: 'topic',
                                },
                                rawEvent: topic,
                                source: this.serviceName,
                            },
                            workerMethod: this.handleEvent,
                        };
                        this.queueEvent(topicEvent);
                    }
                    const getPost = {
                        json: true,
                        method: 'GET',
                        qs: {
                            api_key: process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN,
                            api_username: process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME,
                        },
                        uri: `https://${process.env.DISCOURSE_INSTANCE_URL}/posts/${formData.body.post.id}`,
                    };
                    request(getPost)
                        .then((post) => {
                        const postEvent = {
                            data: {
                                cookedEvent: {
                                    category: topic.category_id,
                                    context: topic.id,
                                    type: formData.headers['x-discourse-event-type'],
                                },
                                rawEvent: post,
                                source: this.serviceName,
                            },
                            workerMethod: this.handleEvent,
                        };
                        this.queueEvent(postEvent);
                    });
                });
                response.send();
            }
        });
    }
    sendMessage(data) {
        const token = data.api_token;
        const username = data.api_username;
        const body = _.clone(data);
        delete body.api_token;
        delete body.api_username;
        const postPost = {
            body,
            json: true,
            url: `https://${process.env.DISCOURSE_INSTANCE_URL}/posts?api_key=${token}&api_username=${username}`
        };
        return request.post(postPost).then((resData) => {
            return {
                response: {
                    ids: {
                        message: resData.id,
                        thread: resData.topic_id,
                    }
                },
                source: this.serviceName,
            };
        });
    }
    getWorkerContextFromMessage(event) {
        return event.data.cookedEvent.context;
    }
    getEventTypeFromMessage(event) {
        return event.cookedEvent.type;
    }
    fetchTopic(topicId) {
        if (this.topicCache.has(topicId)) {
            return Promise.resolve(this.topicCache.get(topicId));
        }
        else {
            const token = process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN;
            const username = process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME;
            const rootUrl = process.env.DISCOURSE_INSTANCE_URL;
            const requestOpts = {
                json: true,
                url: `https://${rootUrl}/t/${topicId}?api_key=${token}&api_username=${username}`
            };
            return request.get(requestOpts).then((resData) => {
                this.topicCache.set(topicId, resData);
                return resData;
            });
        }
    }
    get serviceName() {
        return DiscourseService._serviceName;
    }
}
DiscourseService._serviceName = path.basename(__filename.split('.')[0]);
exports.DiscourseService = DiscourseService;
function createServiceListener() {
    return new DiscourseService(true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter() {
    return new DiscourseService(false);
}
exports.createServiceEmitter = createServiceEmitter;
function createMessageService() {
    return new DiscourseService(false);
}
exports.createMessageService = createMessageService;

//# sourceMappingURL=discourse.js.map
