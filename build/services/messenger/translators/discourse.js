"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const request = require("request-promise");
const Translator = require("./translator");
class DiscourseTranslator {
    constructor(data, hub) {
        this.eventEquivalencies = {
            message: ['post'],
        };
        this.hub = hub;
        this.connectionDetails = data;
    }
    eventTypeIntoMessageType(type) {
        return _.findKey(this.eventEquivalencies, (value) => {
            return _.includes(value, type);
        }) || 'Misc event';
    }
    messageTypeIntoEventTypes(type) {
        return this.eventEquivalencies[type];
    }
    getAllEventTypes() {
        return _.flatMap(this.eventEquivalencies, _.identity);
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
            const metadata = Translator.extractMetadata(details.post.raw, 'img');
            const cookedEvent = {
                details: {
                    genesis: metadata.genesis || event.source,
                    hidden: details.post.post_type === 4,
                    internal: details.post.staff,
                    text: metadata.content.trim(),
                    title: details.topic.title,
                },
                source: {
                    service: event.source,
                    flow: details.topic.category_id.toString(),
                    message: details.post.id.toString(),
                    thread: details.post.topic_id.toString(),
                    url: getTopic.uri,
                    username: details.post.username,
                },
            };
            return {
                context: `${event.source}.${event.cookedEvent.context}`,
                type: this.eventTypeIntoMessageType(event.type),
                cookedEvent,
                rawEvent: event.rawEvent,
                source: 'messenger',
            };
        });
    }
    messageIntoConnectionDetails(message) {
        return this.hub.fetchValue(message.hubUsername, 'discourse', 'token')
            .then((token) => {
            return {
                token,
                username: message.target.username,
                instance: this.connectionDetails.instance,
            };
        });
    }
    messageIntoEmitCreateComment(message) {
        const topicId = message.target.thread;
        if (!topicId) {
            const title = message.details.title;
            if (!title) {
                throw new Error('Cannot create Discourse Thread without a title');
            }
            return { method: ['request'], payload: {
                    method: 'POST',
                    path: '/posts',
                    body: {
                        category: message.target.flow,
                        raw: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message, 'img')}`,
                        title,
                        unlist_topic: 'false',
                    },
                } };
        }
        return { method: ['request'], payload: {
                method: 'POST',
                path: '/posts',
                body: {
                    raw: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message, 'img')}`,
                    topic_id: topicId,
                    whisper: message.details.hidden ? 'true' : 'false',
                },
            } };
    }
    responseIntoMessageResponse(_payload, response) {
        return {
            message: response.id,
            thread: response.topic_id,
            url: `https://${this.connectionDetails.instance}/t/${response.topic_id}`
        };
    }
}
exports.DiscourseTranslator = DiscourseTranslator;
function createTranslator(data, hub) {
    return new DiscourseTranslator(data, hub);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=discourse.js.map
