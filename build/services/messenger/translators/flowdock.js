"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const procbot_1 = require("../../../framework/procbot");
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
        const title = message.details.title;
        const thread = message.target.thread;
        switch (message.action) {
            case 0:
                if (!title) {
                    throw new Error('Cannot create a thread without a title');
                }
                return { method: ['post'], payload: {
                        path: `/flows/${org}/${flow}/messages`,
                        payload: {
                            content: `${title}\n--\n${message.details.text}\n${Translator.stringifyMetadata(message, 'emoji')}`,
                            event: 'message',
                            external_user_name: message.details.internal ? undefined : message.source.username.substring(0, 16),
                        },
                    } };
            case 1:
                if (!thread) {
                    throw new Error('Cannot create a comment without a thread.');
                }
                return { method: ['post'], payload: {
                        path: `/flows/${org}/${flow}/threads/${thread}/messages`,
                        payload: {
                            content: `${message.details.text}\n${Translator.stringifyMetadata(message, 'emoji')}`,
                            event: 'message',
                            external_user_name: message.details.internal ? undefined : message.source.username.substring(0, 16),
                        }
                    } };
            case 2:
                if (!thread) {
                    throw new Error('Cannot search for connections without a thread.');
                }
                return { method: ['get'], payload: {
                        path: `/flows/${org}/${flow}/threads/${thread}/messages`,
                        payload: {
                            search: `This ticket is mirrored in [${message.source.service} thread`,
                        },
                    } };
            default:
                throw new Error(`${message.action} not supported on ${message.target.service}`);
        }
    }
    responseIntoMessageResponse(message, response) {
        switch (message.action) {
            case 0:
            case 1:
                const thread = response.thread_id;
                const org = this.organization;
                const flow = message.target.flow;
                const url = `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`;
                return {
                    message: response.id,
                    thread: response.thread_id,
                    url,
                };
            case 2:
                if (response.length > 0) {
                    return {
                        thread: response[0].content.match(/This ticket is mirrored in \[(?:\w+) thread (\d+)]/i)[1]
                    };
                }
                throw new procbot_1.ProcBotError(1, 'No connected thread found by querying Flowdock.');
            default:
                throw new Error(`${message.action} not supported on ${message.target.service}`);
        }
    }
}
exports.FlowdockTranslator = FlowdockTranslator;
function createTranslator(data, hubs) {
    return new FlowdockTranslator(data, hubs);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
