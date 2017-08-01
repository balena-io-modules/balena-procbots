"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const Translator = require("./translator");
class FlowdockTranslator {
    constructor(data) {
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
        this.session = new flowdock_1.Session(data.token);
        this.organization = data.organization;
    }
    eventIntoMessage(event) {
        const metadata = Translator.extractMetadata(event.rawEvent.content);
        const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
        const flow = event.cookedEvent.flow;
        const thread = event.rawEvent.thread_id;
        const userId = event.rawEvent.user;
        const org = this.organization;
        const rawEvent = {
            first: event.rawEvent.id === event.rawEvent.thread.initial_message,
            genesis: metadata.genesis || event.source,
            hidden: metadata.hidden,
            source: event.source,
            sourceIds: {
                message: event.rawEvent.id,
                flow,
                thread,
                url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
                user: 'duff',
            },
            text: titleAndText ? titleAndText[2] : metadata.content,
            title: titleAndText ? titleAndText[1] : undefined,
        };
        if (event.rawEvent.external_user_name) {
            rawEvent.sourceIds.user = event.rawEvent.external_user_name;
            return Promise.resolve({
                cookedEvent: {
                    context: `front.${event.cookedEvent.context}`,
                    event: 'message',
                },
                rawEvent,
                source: event.source,
            });
        }
        return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
            .then((user) => {
            rawEvent.sourceIds.user = user.nick;
            return ({
                cookedEvent: {
                    context: `front.${event.cookedEvent.context}`,
                    event: 'message',
                },
                rawEvent,
                source: event.source,
            });
        });
    }
    messageIntoEmitCreateMessage(message) {
        const titleText = message.first && message.title ? message.title + '\n--\n' : '';
        return new Promise((resolve) => {
            resolve({
                method: 'POST',
                path: '/flows/${org}/${flow}/messages/',
                payload: {
                    content: titleText + message.text + '\n' + Translator.stringifyMetadata(message),
                    event: 'message',
                    thread_id: message.toIds.thread,
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
                path: `/flows/${org}/${message.sourceIds.flow}/threads/${message.sourceIds.thread}/messages`,
                payload: {
                    search: firstWords[1],
                },
            });
        }
        return Promise.resolve({
            method: 'GET',
            path: `/flows/${org}/${message.sourceIds.flow}/threads/${message.sourceIds.thread}/messages`,
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
function createTranslator(data) {
    return new FlowdockTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
