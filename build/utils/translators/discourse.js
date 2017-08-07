"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const request = require("request-promise");
const Translator = require("./translator");
class DiscourseTranslator {
    constructor(data) {
        this.connectionDetails = data;
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
            const first = details.post.post_number === 1;
            const rawEvent = {
                details: {
                    genesis: metadata.genesis || event.source,
                    hidden: first ? !details.topic.visible : details.post.post_type === 4,
                    text: metadata.content,
                    title: details.topic.title,
                },
                source: {
                    service: event.source,
                    flow: details.topic.category_id.toString(),
                    message: details.post.id.toString(),
                    thread: details.post.topic_id.toString(),
                    url: getTopic.uri,
                    user: details.post.username,
                },
            };
            return {
                cookedEvent: {
                    context: `${event.source}.${event.cookedEvent.context}`,
                    event: 'message',
                },
                rawEvent,
                source: 'messenger',
            };
        });
    }
    messageIntoEmitCreateMessage(message) {
        const topicId = message.target.thread;
        if (!topicId) {
            const title = message.details.title;
            if (!title) {
                throw new Error('Cannot create Discourse Thread without a title');
            }
            return Promise.resolve({
                json: true,
                method: 'POST',
                path: '/posts',
                payload: {
                    category: message.target.flow,
                    raw: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message)}`,
                    title,
                    unlist_topic: message.details.hidden ? 'true' : 'false',
                },
            });
        }
        return Promise.resolve({
            json: true,
            method: 'POST',
            path: '/posts',
            payload: {
                raw: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message)}`,
                topic_id: topicId,
                whisper: message.details.hidden ? 'true' : 'false',
            },
        });
    }
    messageIntoEmitReadThread(message, shortlist) {
        const firstWords = shortlist && shortlist.source.match(/^([\w\s]+)/i);
        if (firstWords) {
            return Promise.resolve({
                json: true,
                method: 'GET',
                qs: {
                    'term': firstWords[1],
                    'search_context[type]': 'topic',
                    'search_context[id]': message.source.thread,
                },
                path: '/search/query',
            });
        }
        return Promise.resolve({
            json: true,
            method: 'GET',
            path: `/t/${message.source.thread}`,
        });
    }
    eventNameIntoTriggers(name) {
        const equivalents = {
            message: ['post'],
        };
        return equivalents[name];
    }
    getAllTriggers() {
        return ['post'];
    }
}
exports.DiscourseTranslator = DiscourseTranslator;
function createTranslator(data) {
    return new DiscourseTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=discourse.js.map
