"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const messenger_1 = require("./messenger");
const messenger_types_1 = require("./messenger-types");
class DiscourseService extends messenger_1.Messenger {
    constructor(data, listen = true) {
        super(listen);
        this.receivedPostIds = new Set();
        this.makeGeneric = (data) => {
            const getGeneric = {
                json: true,
                method: 'GET',
                qs: {
                    api_key: this.data.token,
                    api_username: this.data.username,
                },
                uri: `https://${this.data.instance}`,
            };
            const getPost = _.cloneDeep(getGeneric);
            getPost.uri += `/posts/${data.rawEvent.id}`;
            const getTopic = _.cloneDeep(getGeneric);
            getTopic.uri += `/t/${data.rawEvent.topic_id}`;
            return Promise.props({
                post: request(getPost),
                topic: request(getTopic),
            })
                .then((details) => {
                const metadata = messenger_1.Messenger.extractMetadata(details.post.raw, 'img');
                const first = details.post.post_number === 1;
                return {
                    action: messenger_types_1.MessengerAction.Create,
                    first,
                    genesis: metadata.genesis || data.source,
                    hidden: first ? !details.topic.visible : details.post.post_type === 4,
                    source: DiscourseService._serviceName,
                    sourceIds: {
                        flow: details.topic.category_id.toString(),
                        message: details.post.id.toString(),
                        thread: details.post.topic_id.toString(),
                        url: getTopic.uri,
                        user: details.post.username,
                    },
                    tags: details.topic.tags,
                    text: metadata.content,
                    title: details.topic.title,
                };
            });
        };
        this.makeSpecific = (data) => {
            const topicId = data.toIds.thread;
            const footer = `${messenger_1.Messenger.stringifyMetadata(data, 'img')} ${messenger_1.Messenger.messageOfTheDay()}`;
            const raw = `${data.text}\n\n---${footer}\n`;
            const endpoint = {
                method: 'POST',
                qs: {
                    api_key: data.toIds.token,
                    api_username: data.toIds.user,
                },
                url: `https://${this.data.instance}/posts`,
            };
            if (!topicId) {
                const title = data.title;
                if (!title) {
                    throw new Error('Cannot create Discourse Thread without a title');
                }
                return new Promise((resolve) => {
                    resolve({
                        endpoint,
                        payload: {
                            category: data.toIds.flow,
                            raw,
                            'tags[]': data.tags,
                            title,
                            unlist_topic: data.hidden ? 'true' : 'false',
                        }
                    });
                });
            }
            return new Promise((resolve) => {
                resolve({
                    endpoint,
                    payload: {
                        raw,
                        topic_id: topicId,
                        whisper: data.hidden ? 'true' : 'false',
                    },
                });
            });
        };
        this.makeTagUpdate = (data) => {
            const topicId = data.toIds.thread;
            if (!topicId) {
                throw new Error('Cannot update tags without specifying thread');
            }
            return request({
                json: true,
                method: 'GET',
                qs: {
                    api_key: data.toIds.token,
                    api_username: data.toIds.user,
                },
                url: `https://${this.data.instance}/t/${topicId}.json`,
            }).then((response) => {
                return {
                    endpoint: {
                        method: 'PUT',
                        qs: {
                            api_key: data.toIds.token,
                            api_username: data.toIds.user,
                            'tags[]': data.tags ? data.tags : [],
                        },
                        url: `https://${this.data.instance}/t/${response.slug}/${topicId}.json`,
                    },
                    payload: {},
                };
            });
        };
        this.fetchNotes = (thread, _room, filter) => {
            const firstWords = filter.source.match(/^([\w\s]+)/i);
            const getThread = firstWords ? {
                json: true,
                method: 'GET',
                qs: {
                    api_key: this.data.token,
                    api_username: this.data.username,
                    term: firstWords[1],
                    'search_context[type]': 'topic',
                    'search_context[id]': thread,
                },
                uri: `https://${this.data.instance}/search/query`,
            } : {
                json: true,
                method: 'GET',
                qs: {
                    api_key: this.data.token,
                    api_username: this.data.username,
                },
                uri: `https://${this.data.instance}/t/${thread}`,
            };
            return request(getThread).then((threadObject) => {
                return _.map(firstWords ? threadObject.posts : threadObject.post_stream.posts, (item) => {
                    return item.cooked;
                }).filter((value) => {
                    const match = value.match(filter);
                    return match !== null && match.length > 0;
                });
            });
        };
        this.activateMessageListener = () => {
            messenger_1.Messenger.expressApp.post(`/${DiscourseService._serviceName}/`, (formData, response) => {
                if (!this.receivedPostIds.has(formData.body.post.id)) {
                    this.receivedPostIds.add(formData.body.post.id);
                    this.queueEvent({
                        data: {
                            cookedEvent: {
                                context: formData.body.post.topic_id,
                                type: 'post',
                            },
                            rawEvent: formData.body.post,
                            source: DiscourseService._serviceName,
                        },
                        workerMethod: this.handleEvent,
                    });
                }
                response.sendStatus(200);
            });
        };
        this.sendPayload = (data) => {
            const requestOptions = {
                body: data.payload,
                json: true,
                method: data.endpoint.method,
                qs: data.endpoint.qs,
                qsStringifyOptions: {
                    arrayFormat: 'repeat',
                },
                url: data.endpoint.url,
            };
            return request(requestOptions).then((resData) => {
                return {
                    response: {
                        message: resData.id,
                        thread: resData.topic_id,
                        url: `https://${this.data.instance}/t/${resData.topic_id}`
                    },
                    source: DiscourseService._serviceName,
                };
            });
        };
        this.data = data;
    }
    translateEventName(eventType) {
        const equivalents = {
            message: 'post',
        };
        return equivalents[eventType];
    }
    get serviceName() {
        return DiscourseService._serviceName;
    }
    get apiHandle() {
        return;
    }
}
DiscourseService._serviceName = path.basename(__filename.split('.')[0]);
exports.DiscourseService = DiscourseService;
function createServiceListener(data) {
    return new DiscourseService(data, true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new DiscourseService(data, false);
}
exports.createServiceEmitter = createServiceEmitter;
function createMessageService(data) {
    return new DiscourseService(data, false);
}
exports.createMessageService = createMessageService;

//# sourceMappingURL=discourse.js.map
