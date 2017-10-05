"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const flowdock_1 = require("flowdock");
const _ = require("lodash");
const translator_1 = require("./translator");
const translator_scaffold_1 = require("./translator-scaffold");
class FlowdockTranslator extends translator_scaffold_1.TranslatorScaffold {
    constructor(data, hubs) {
        super();
        this.eventEquivalencies = {
            message: ['message'],
        };
        this.emitConverters = {};
        this.responseConverters = {
            [2]: FlowdockTranslator.convertReadConnectionResponse,
            [3]: FlowdockTranslator.convertUpdateThreadResponse,
            [1]: FlowdockTranslator.convertUpdateThreadResponse,
        };
        this.hubs = hubs;
        this.session = new flowdock_1.Session(data.token);
        this.session.on('error', _.partial(console.log, 'error looking up data from Flowdock.'));
        this.organization = data.organization;
        this.responseConverters[0] =
            _.partial(FlowdockTranslator.convertCreateThreadResponse, data.organization);
        this.emitConverters[0] =
            _.partial(FlowdockTranslator.createThreadIntoEmit, data.organization);
        this.emitConverters[1] =
            _.partial(FlowdockTranslator.createMessageIntoEmit, data.organization);
        this.emitConverters[3] =
            _.partial(FlowdockTranslator.updateTagsIntoEmit, data.organization, this.session);
        this.emitConverters[2] =
            _.partial(FlowdockTranslator.readConnectionIntoEmit, data.organization);
    }
    static createFormattedText(body, header, footer) {
        const lengthLimit = 8096;
        const first = header ? `${header}\n--\n` : '';
        const last = footer ? `\n${footer}` : '';
        if ((first.length + body.length + last.length) < lengthLimit) {
            return `${first}${body}${last}`;
        }
        const snipProvisional = '\n\n`... about xx% shown.`';
        const snipped = body.substr(0, lengthLimit - first.length - snipProvisional.length - last.length);
        const snip = snipProvisional.replace('xx', Math.floor((100 * snipped.length) / body.length).toString(10));
        return `${first}${snipped}${snip}${last}`;
    }
    static convertCreateThreadResponse(org, message, response) {
        const thread = response.thread_id;
        const flow = message.target.flow;
        const url = `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`;
        return Promise.resolve({
            thread: response.thread_id,
            url,
        });
    }
    static convertReadConnectionResponse(message, response) {
        if (response.length > 0) {
            const idFinder = new RegExp(`\\[${message.source.service} thread ([\\w\\d-+\\/=]+)]`, 'i');
            return Promise.resolve({
                thread: response[0].content.match(idFinder)[1],
            });
        }
        return Promise.reject(new translator_1.TranslatorError(3, 'No connected thread found by querying Flowdock.'));
    }
    static convertUpdateThreadResponse(_message, _response) {
        return Promise.resolve({});
    }
    static createThreadIntoEmit(orgId, message) {
        const flowId = message.target.flow;
        if (!message.details.title) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot create a thread without a title'));
        }
        return Promise.resolve({ method: ['post'], payload: {
                path: `/flows/${orgId}/${flowId}/messages`,
                payload: {
                    content: FlowdockTranslator.createFormattedText(message.details.text, message.details.title, translator_scaffold_1.TranslatorScaffold.stringifyMetadata(message, 'emoji')),
                    event: 'message',
                    external_user_name: message.details.internal ? undefined : message.details.handle.substring(0, 16),
                },
            } });
    }
    static createMessageIntoEmit(orgId, message) {
        const threadId = message.target.thread;
        if (!threadId) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot create a comment without a thread.'));
        }
        return Promise.resolve({ method: ['post'], payload: {
                path: `/flows/${orgId}/${message.target.flow}/threads/${threadId}/messages`,
                payload: {
                    content: FlowdockTranslator.createFormattedText(message.details.text, undefined, translator_scaffold_1.TranslatorScaffold.stringifyMetadata(message, 'emoji')),
                    event: 'message',
                    external_user_name: message.details.internal ? undefined : message.details.handle.substring(0, 16),
                }
            } });
    }
    static updateTagsIntoEmit(orgId, session, message) {
        const threadId = message.target.thread;
        if (!threadId) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot update tags without a thread.'));
        }
        const tags = message.details.tags;
        if (!_.isArray(tags)) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot update tags without a tags array.'));
        }
        const flowId = message.target.flow;
        return FlowdockTranslator.fetchFromSession(session, `/flows/${orgId}/${flowId}/threads/${threadId}`)
            .then((threadResponse) => {
            return FlowdockTranslator.fetchFromSession(session, `/flows/${orgId}/${flowId}/messages/${threadResponse.initial_message}`);
        })
            .then((initialMessage) => {
            const systemTags = _.filter(initialMessage.tags, (tag) => {
                return /^:/.test(tag);
            });
            return { method: ['put'], payload: {
                    path: `/flows/${orgId}/${flowId}/messages/${initialMessage.id}`,
                    payload: { tags: _.concat(tags, systemTags) },
                } };
        });
    }
    static readConnectionIntoEmit(orgId, message) {
        const threadId = message.target.thread;
        if (!threadId) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot search for connections without a thread.'));
        }
        return Promise.resolve({ method: ['get'], payload: {
                path: `/flows/${orgId}/${message.target.flow}/threads/${threadId}/messages`,
                payload: {
                    search: `[${message.source.service} thread`,
                },
            } });
    }
    eventIntoMessage(event) {
        const emojiMetadata = translator_scaffold_1.TranslatorScaffold.extractMetadata(event.rawEvent.content, 'emoji');
        const charMetadata = translator_scaffold_1.TranslatorScaffold.extractMetadata(event.rawEvent.content, 'char');
        const metadata = emojiMetadata.content.length < charMetadata.content.length ? emojiMetadata : charMetadata;
        const titleSplitter = /^(.*)\n--\n((?:\r|\n|.)*)$/;
        const titleAndText = metadata.content.match(titleSplitter);
        const text = titleAndText ? titleAndText[2].trim() : metadata.content.trim();
        const flow = event.cookedEvent.flow;
        const thread = event.rawEvent.thread_id;
        const userId = event.rawEvent.user;
        const org = this.organization;
        const firstMessageId = event.rawEvent.thread.initial_message;
        const tagFilter = (tag) => {
            return !/^:/.test(tag);
        };
        const cookedEvent = {
            details: {
                genesis: metadata.genesis || event.source,
                handle: 'duff',
                hidden: metadata.hidden,
                internal: !!event.rawEvent.external_user_name,
                tags: [],
                text,
                title: 'duff',
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
        return FlowdockTranslator.fetchFromSession(this.session, `flows/${org}/${flow}/messages/${firstMessageId}`)
            .then((firstMessage) => {
            cookedEvent.details.tags = _.uniq(firstMessage.tags.filter(tagFilter));
            const findTitle = firstMessage.content.match(titleSplitter);
            cookedEvent.details.title = findTitle ? findTitle[1].trim() : firstMessage.content;
            return Promise.resolve(undefined);
        })
            .then(() => {
            if (event.rawEvent.external_user_name) {
                return event.rawEvent.external_user_name;
            }
            return FlowdockTranslator.fetchFromSession(this.session, `/organizations/${org}/users/${userId}`)
                .then((user) => {
                return user.nick;
            });
        })
            .then((username) => {
            cookedEvent.source.username = username;
            cookedEvent.details.handle = username;
            return {
                context: `${event.source}.${event.cookedEvent.context}`,
                type: this.eventIntoMessageType(event),
                cookedEvent,
                rawEvent: event.rawEvent,
                source: event.source,
            };
        });
    }
    messageIntoEmitterConstructor(message) {
        const promises = _.map(this.hubs, (hub) => {
            return hub.fetchValue(message.details.internal ? message.target.username : 'generic', 'flowdock', 'token');
        });
        return Promise.any(promises)
            .then((token) => {
            return {
                organization: this.organization,
                token,
                type: 1
            };
        });
    }
    mergeGenericDetails(connectionDetails, genericDetails) {
        if (connectionDetails.type === undefined) {
            connectionDetails.type = genericDetails.type;
        }
        return connectionDetails;
    }
}
FlowdockTranslator.fetchFromSession = (session, path, search) => {
    return new Promise((resolve, reject) => {
        session.get(path, { search }, (error, result) => {
            if (result) {
                resolve(result);
            }
            else {
                reject(error);
            }
        });
    });
};
exports.FlowdockTranslator = FlowdockTranslator;
function createTranslator(data, hubs) {
    return new FlowdockTranslator(data, hubs);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=flowdock.js.map
