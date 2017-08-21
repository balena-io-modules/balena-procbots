"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const Translator = require("./translator");
class FlowdockTranslator {
    constructor(data, hubs) {
        this.eventEquivalencies = {
            message: ['message'],
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
        this.hubs = hubs;
        this.session = new flowdock_1.Session(data.token);
        this.organization = data.organization;
    }
    eventIntoMessageType(event) {
        return _.findKey(this.eventEquivalencies, (value) => {
            return _.includes(value, event.type);
        }) || 'Misc event';
    }
    messageTypeIntoEventTypes(type) {
        return this.eventEquivalencies[type];
    }
    getAllEventTypes() {
        return _.flatMap(this.eventEquivalencies, _.identity);
    }
    eventIntoMessage(event) {
        const metadata = Translator.extractMetadata(event.rawEvent.content, 'emoji');
        const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
        const flow = event.cookedEvent.flow;
        const thread = event.rawEvent.thread_id;
        const userId = event.rawEvent.user;
        const org = this.organization;
        const cookedEvent = {
            details: {
                genesis: metadata.genesis || event.source,
                hidden: metadata.hidden,
                internal: !!event.rawEvent.external_user_name,
                text: titleAndText ? titleAndText[2].trim() : metadata.content.trim(),
                title: titleAndText ? titleAndText[1] : undefined,
            },
            source: {
                service: event.source,
                message: event.rawEvent.id,
                flow,
                thread,
                url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
                username: 'duff',
            },
        };
        if (event.rawEvent.external_user_name) {
            cookedEvent.source.username = event.rawEvent.external_user_name;
            return Promise.resolve({
                context: `${event.source}.${event.cookedEvent.context}`,
                type: this.eventIntoMessageType(event),
                cookedEvent,
                rawEvent: event.rawEvent,
                source: event.source,
            });
        }
        return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
            .then((user) => {
            cookedEvent.source.username = user.nick;
            return ({
                context: `${event.source}.${event.cookedEvent.context}`,
                type: this.eventIntoMessageType(event),
                cookedEvent,
                rawEvent: event.rawEvent,
                source: 'messenger',
            });
        });
    }
    messageIntoConnectionDetails(message) {
        const promises = _.map(this.hubs, (hub) => {
            return hub.fetchValue(message.hub.username, 'flowdock', 'token');
        });
        return Promise.any(promises)
            .then((token) => {
            return {
                organization: this.organization,
                token,
            };
        });
    }
    messageIntoEmitDetails(message) {
        const org = this.organization;
        const flow = message.target.flow;
        switch (message.action) {
            case 'createThread':
                const title = message.details.title;
                if (!title) {
                    throw new Error('Cannot create Discourse Thread without a title');
                }
                const titleText = title + '\n--\n';
                return { method: ['post'], payload: {
                        path: `/flows/${org}/${flow}/messages/`,
                        payload: {
                            content: titleText + message.details.text + '\n' + Translator.stringifyMetadata(message, 'emoji'),
                            event: 'message',
                            external_user_name: message.details.internal ? undefined : message.source.username.substring(0, 16),
                        },
                    } };
            case 'createComment':
                return { method: ['post'], payload: {
                        path: `/flows/${org}/${flow}/threads/${message.target.thread}/messages/`,
                        payload: {
                            content: message.details.text + '\n' + Translator.stringifyMetadata(message, 'emoji'),
                            event: 'message',
                            external_user_name: message.details.internal ? undefined : message.source.username.substring(0, 16),
                        }
                    } };
            default:
                throw new Error(`${message.action} not supported on ${message.target.service}`);
        }
    }
    responseIntoMessageResponse(payload, response) {
        const thread = response.thread_id;
        const org = this.organization;
        const flow = payload.target.flow;
        const url = `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`;
        return {
            message: response.id,
            thread: response.thread_id,
            url,
        };
    }
}
exports.FlowdockTranslator = FlowdockTranslator;
function createTranslator(data, hubs) {
    return new FlowdockTranslator(data, hubs);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
