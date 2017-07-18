"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const request = require("request-promise");
const messenger_types_1 = require("../../services/messenger-types");
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
            const metadata = Translator.extractMetadata(details.post.raw);
            const first = details.post.post_number === 1;
            return {
                action: messenger_types_1.MessageAction.Create,
                first,
                genesis: metadata.genesis || event.source,
                hidden: first ? !details.topic.visible : details.post.post_type === 4,
                source: event.source,
                sourceIds: {
                    flow: details.topic.category_id.toString(),
                    message: details.post.id.toString(),
                    thread: details.post.topic_id.toString(),
                    url: getTopic.uri,
                    user: details.post.username,
                },
                text: metadata.content,
                title: details.topic.title,
            };
        });
    }
    messageIntoEmitCreateMessage(message) {
        const topicId = message.toIds.thread;
        if (!topicId) {
            const title = message.title;
            if (!title) {
                throw new Error('Cannot create Discourse Thread without a title');
            }
            return Promise.resolve({
                json: true,
                method: 'POST',
                path: '/posts',
                payload: {
                    category: message.toIds.flow,
                    raw: `${message.text}\n\n---\n${Translator.stringifyMetadata(message)}`,
                    title,
                    unlist_topic: message.hidden ? 'true' : 'false',
                },
            });
        }
        return Promise.resolve({
            json: true,
            method: 'POST',
            path: '/posts',
            payload: {
                raw: `${message.text}\n\n---\n${Translator.stringifyMetadata(message)}`,
                topic_id: topicId,
                whisper: message.hidden ? 'true' : 'false',
            },
        });
    }
    messageIntoEmitReadHistory(message, shortlist) {
        const firstWords = shortlist.source.match(/^([\w\s]+)/i);
        if (firstWords) {
            return {
                json: true,
                method: 'GET',
                qs: {
                    'api_key': this.connectionDetails.token,
                    'api_username': this.connectionDetails.username,
                    'term': firstWords[1],
                    'search_context[type]': 'topic',
                    'search_context[id]': message.sourceIds.thread,
                },
                uri: `https://${this.connectionDetails.instance}/search/query`,
            };
        }
        return {
            json: true,
            method: 'GET',
            qs: {
                api_key: this.connectionDetails.token,
                api_username: this.connectionDetails.username,
            },
            uri: `https://${this.connectionDetails.instance}/t/${message.sourceIds.thread}`,
        };
    }
    eventNameIntoTriggers(name) {
        const equivalents = {
            message: ['post'],
        };
        return equivalents[name];
    }
}
exports.DiscourseTranslator = DiscourseTranslator;
function createTranslator(data) {
    return new DiscourseTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=discourse.js.map
