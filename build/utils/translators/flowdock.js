"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const Translator = require("./translator");
class FlowdockTranslator {
    constructor(data, hub) {
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
    eventIntoMessage(event) {
        const metadata = Translator.extractMetadata(event.rawEvent.content, 'emoji');
        const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
        const flow = event.cookedEvent.flow;
        const thread = event.rawEvent.thread_id;
        const userId = event.rawEvent.user;
        const org = this.organization;
        const rawEvent = {
            details: {
                genesis: metadata.genesis || event.source,
                hidden: metadata.hidden,
                text: titleAndText ? titleAndText[2] : metadata.content,
                title: titleAndText ? titleAndText[1] : undefined,
            },
            source: {
                service: event.source,
                message: event.rawEvent.id,
                flow,
                thread,
                url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
                user: 'duff',
            },
        };
        if (event.rawEvent.external_user_name) {
            rawEvent.source.user = event.rawEvent.external_user_name;
            return Promise.resolve({
                cookedEvent: {
                    context: `${event.source}.${event.cookedEvent.context}`,
                    event: 'message',
                },
                rawEvent,
                source: event.source,
            });
        }
        return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
            .then((user) => {
            rawEvent.source.user = user.nick;
            return ({
                cookedEvent: {
                    context: `${event.source}.${event.cookedEvent.context}`,
                    event: 'message',
                },
                rawEvent,
                source: 'messenger',
            });
        });
    }
    messageIntoEmitCreateMessage(message) {
        const titleText = message.details.title ? message.details.title + '\n--\n' : '';
        return new Promise((resolve) => {
            resolve({
                method: 'POST',
                path: '/flows/${org}/${flow}/messages/',
                payload: {
                    content: titleText + message.details.text + '\n' + Translator.stringifyMetadata(message),
                    event: 'message',
                    thread_id: message.target.thread,
                },
            });
        });
    }
    messageIntoEmitReadThread(message, shortlist) {
        const org = this.organization;
        const firstWords = shortlist && shortlist.source.match(/^([\w\s]+)/i);
        if (firstWords) {
            return Promise.resolve({
                method: 'GET',
                path: `/flows/${org}/${message.source.flow}/threads/${message.source.thread}/messages`,
                payload: {
                    search: firstWords[1],
                },
            });
        }
        return Promise.resolve({
            method: 'GET',
            path: `/flows/${org}/${message.source.flow}/threads/${message.source.thread}/messages`,
        });
    }
    eventNameIntoTriggers(name) {
        const equivalents = {
            message: ['message'],
        };
        return equivalents[name];
    }
    getAllTriggers() {
        return ['message'];
    }
}
exports.FlowdockTranslator = FlowdockTranslator;
function createTranslator(data, hub) {
    return new FlowdockTranslator(data, hub);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
