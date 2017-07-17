"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const messenger_types_1 = require("../../services/messenger-types");
const translator_1 = require("./translator");
class FlowdockTranslator extends translator_1.Translator {
    constructor(data) {
        super();
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
        const metadata = translator_1.Translator.extractMetadata(event.rawEvent.content);
        const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
        const flow = event.cookedEvent.flow;
        const thread = event.rawEvent.thread_id;
        const userId = event.rawEvent.user;
        const org = this.organization;
        const returnValue = {
            action: messenger_types_1.MessageAction.Create,
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
            returnValue.sourceIds.user = event.rawEvent.external_user_name;
            return Promise.resolve(returnValue);
        }
        return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
            .then((user) => {
            returnValue.sourceIds.user = user.nick;
            return (returnValue);
        });
    }
    messageIntoEmit(message) {
        const titleText = message.first && message.title ? message.title + '\n--\n' : '';
        return new Promise((resolve) => {
            resolve({
                method: 'POST',
                path: '/flows/${org}/${flow}/messages/',
                payload: {
                    content: titleText + message.text + '\n' + translator_1.Translator.stringifyMetadata(message),
                    event: 'message',
                    thread_id: message.toIds.thread,
                },
            });
        });
    }
    eventNameIntoTriggers(name) {
        const equivalents = {
            message: ['message'],
        };
        return equivalents[name];
    }
}
exports.FlowdockTranslator = FlowdockTranslator;
function createTranslator(data) {
    return new FlowdockTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
