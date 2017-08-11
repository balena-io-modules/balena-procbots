"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const Translator = require("./translator");
class FlowdockTranslator {
    constructor(data, hub) {
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
        this.hub = hub;
        this.session = new flowdock_1.Session(data.token);
        this.organization = data.organization;
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
                type: this.eventTypeIntoMessageType(event.type),
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
                type: this.eventTypeIntoMessageType(event.type),
                cookedEvent,
                rawEvent: event.rawEvent,
                source: 'messenger',
            });
        });
    }
    messageIntoConnectionDetails(message) {
        return this.hub.fetchValue(message.hubUsername, 'flowdock', 'token')
            .then((token) => {
            return {
                organization: this.organization,
                token,
            };
        });
    }
    messageIntoCreateThread(message) {
        const titleText = message.target.flow ? message.details.title + '\n--\n' : '';
        const org = this.organization;
        const flow = message.target.flow;
        return { method: ['_request'], payload: {
                htmlVerb: 'POST',
                path: `/flows/${org}/${flow}/messages/`,
                payload: {
                    content: titleText + message.details.text + '\n' + Translator.stringifyMetadata(message, 'emoji'),
                    event: 'message',
                    external_user_name: message.details.internal ? undefined : message.source.username.substring(0, 16),
                    thread_id: message.target.thread,
                },
            } };
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
function createTranslator(data, hub) {
    return new FlowdockTranslator(data, hub);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
