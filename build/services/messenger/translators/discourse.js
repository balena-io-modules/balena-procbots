"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const request = require("request-promise");
const translator_1 = require("./translator");
const translator_scaffold_1 = require("./translator-scaffold");
class DiscourseTranslator extends translator_scaffold_1.TranslatorScaffold {
    constructor(data, hubs) {
        super();
        this.eventEquivalencies = {
            message: ['post_created'],
        };
        this.emitConverters = {
            [0]: DiscourseTranslator.createThreadIntoEmit,
            [1]: DiscourseTranslator.createMessageIntoEmit,
            [2]: DiscourseTranslator.readConnectionIntoEmit,
        };
        this.responseConverters = {
            [2]: DiscourseTranslator.convertReadConnectionResponse,
            [3]: DiscourseTranslator.convertUpdateThreadResponse,
            [1]: DiscourseTranslator.convertUpdateThreadResponse,
        };
        this.hubs = hubs;
        this.connectionDetails = data;
        this.emitConverters[3] = _.partial(DiscourseTranslator.updateTagsIntoEmit, data);
        this.responseConverters[0] =
            _.partial(DiscourseTranslator.convertCreateThreadResponse, data.instance);
    }
    static createThreadIntoEmit(message) {
        const title = message.details.title;
        if (!title) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot create a thread without a title.'));
        }
        return Promise.resolve({ method: ['request'], payload: {
                htmlVerb: 'POST',
                path: '/posts',
                body: {
                    category: message.target.flow,
                    raw: `${message.details.text}\n\n---\n${translator_scaffold_1.TranslatorScaffold.stringifyMetadata(message, 'logo')}`,
                    title,
                    unlist_topic: 'false',
                },
            } });
    }
    static createMessageIntoEmit(message) {
        const thread = message.target.thread;
        if (!thread) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot create a comment without a thread.'));
        }
        return Promise.resolve({ method: ['request'], payload: {
                htmlVerb: 'POST',
                path: '/posts',
                body: {
                    raw: `${message.details.text}\n\n---\n${translator_scaffold_1.TranslatorScaffold.stringifyMetadata(message, 'logo')}`,
                    topic_id: thread,
                    whisper: message.details.hidden ? 'true' : 'false',
                }
            } });
    }
    static readConnectionIntoEmit(message) {
        const thread = message.target.thread;
        if (!thread) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot search for connections without a thread.'));
        }
        return Promise.resolve({ method: ['request'], payload: {
                htmlVerb: 'GET',
                path: '/search/query',
                qs: {
                    term: `Connects to [${message.source.service} thread`,
                    'search_context[type]': 'topic',
                    'search_context[id]': thread,
                }
            } });
    }
    static updateTagsIntoEmit(connectionDetails, message) {
        const thread = message.target.thread;
        if (!thread) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot update tags without a thread.'));
        }
        const tags = message.details.tags;
        if (!_.isArray(tags)) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot update tags without a tags array.'));
        }
        const getTopic = {
            json: true,
            method: 'GET',
            qs: {
                api_key: connectionDetails.token,
                api_username: connectionDetails.username,
            },
            url: `https://${connectionDetails.instance}/t/${message.target.thread}`,
        };
        return request(getTopic)
            .then((topicResponse) => {
            return { method: ['request'], payload: {
                    body: {},
                    htmlVerb: 'PUT',
                    qs: {
                        'tags[]': tags,
                    },
                    path: `/t/${topicResponse.slug}/${thread}.json`,
                } };
        });
    }
    static convertCreateThreadResponse(instance, _message, response) {
        return Promise.resolve({
            thread: response.topic_id,
            url: `https://${instance}/t/${response.topic_id}`
        });
    }
    static convertReadConnectionResponse(message, response) {
        const idFinder = new RegExp(`Connects to ${message.source.service} thread ([\\w\\d-+\\/=]+)`, 'i');
        if (response.posts.length > 0) {
            return Promise.resolve({
                thread: response.posts[0].blurb.match(idFinder)[1],
            });
        }
        return Promise.reject(new translator_1.TranslatorError(3, 'No connected thread found by querying Discourse.'));
    }
    static convertUpdateThreadResponse(_message, _response) {
        return Promise.resolve({});
    }
    eventIntoMessage(event) {
        const getGeneric = {
            json: true,
            method: 'GET',
            qs: {
                api_key: this.connectionDetails.token,
                api_username: this.connectionDetails.username,
            },
            uri: `https://${this.connectionDetails.instance}`,
        };
        const getPost = _.cloneDeep(getGeneric);
        getPost.uri += `/posts/${event.rawEvent.id}`;
        const getTopic = _.cloneDeep(getGeneric);
        getTopic.uri += `/t/${event.rawEvent.topic_id}`;
        return Promise.props({
            post: request(getPost),
            topic: request(getTopic),
        })
            .then((details) => {
            const metadata = translator_scaffold_1.TranslatorScaffold.extractMetadata(details.post.raw, 'logo');
            const convertedUsername = /^_/.test(details.post.username)
                ? `${details.post.username.replace(/^_/, '')}-`
                : details.post.username;
            const cookedEvent = {
                details: {
                    genesis: metadata.genesis || event.source,
                    handle: convertedUsername,
                    hidden: details.post.post_type === 4,
                    internal: details.post.staff,
                    tags: details.topic.tags,
                    text: metadata.content.trim(),
                    title: details.topic.title,
                },
                source: {
                    service: event.source,
                    flow: details.topic.category_id.toString(),
                    message: details.post.id.toString(),
                    thread: details.post.topic_id.toString(),
                    url: getTopic.uri,
                    username: convertedUsername,
                },
            };
            return {
                context: `${event.source}.${event.cookedEvent.context}`,
                type: this.eventIntoMessageType(event),
                cookedEvent,
                rawEvent: event.rawEvent,
                source: 'messenger',
            };
        });
    }
    messageIntoEmitterConstructor(message) {
        const promises = _.map(this.hubs, (hub) => {
            return hub.fetchValue(message.target.username, 'discourse', 'token');
        });
        const convertedUsername = /-$/.test(message.target.username)
            ? `_${message.target.username.replace(/-$/, '')}`
            : message.target.username;
        return Promise.any(promises)
            .then((token) => {
            return {
                token,
                username: convertedUsername,
                instance: this.connectionDetails.instance,
                type: 1,
            };
        });
    }
    mergeGenericDetails(connectionDetails, genericDetails) {
        if (connectionDetails.server === undefined) {
            connectionDetails.server = genericDetails.server;
        }
        if (connectionDetails.type === undefined) {
            connectionDetails.type = genericDetails.type;
        }
        return connectionDetails;
    }
}
exports.DiscourseTranslator = DiscourseTranslator;
function createTranslator(data, hubs) {
    return new DiscourseTranslator(data, hubs);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=discourse.js.map
