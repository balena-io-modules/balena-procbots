"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const front_sdk_1 = require("front-sdk");
const _ = require("lodash");
const request = require("request-promise");
const translator_1 = require("./translator");
const translator_scaffold_1 = require("./translator-scaffold");
class FrontTranslator extends translator_scaffold_1.TranslatorScaffold {
    constructor(data) {
        super();
        this.eventEquivalencies = {
            message: ['comment', 'out_reply', 'inbound', 'mention'],
        };
        this.emitConverters = {
            [2]: FrontTranslator.readConnectionIntoEmit,
            [3]: FrontTranslator.updateTagsIntoEmit,
        };
        this.responseConverters = {
            [3]: FrontTranslator.convertUpdateThreadResponse,
            [1]: FrontTranslator.convertUpdateThreadResponse,
            [2]: FrontTranslator.convertReadConnectionResponse,
        };
        this.connectionDetails = data;
        this.session = new front_sdk_1.Front(data.token);
        this.responseConverters[0] =
            _.partial(FrontTranslator.convertCreateThreadResponse, this.session);
        this.emitConverters[1] =
            _.partial(FrontTranslator.createMessageIntoEmit, this.connectionDetails);
        this.emitConverters[0] =
            _.partial(FrontTranslator.createThreadIntoEmit, this.connectionDetails);
    }
    static fetchAuthorName(connectionDetails, message) {
        if (message.author) {
            return Promise.resolve(message.author.username.replace('_', '-'));
        }
        for (const recipient of message.recipients) {
            if (recipient.role === 'from') {
                const contactUrl = recipient._links.related.contact;
                if (contactUrl) {
                    return FrontTranslator.fetchContactName(connectionDetails, contactUrl);
                }
                return Promise.resolve(recipient.handle.replace('_', '-'));
            }
        }
        return Promise.resolve('Unknown Author');
    }
    static fetchContactName(connectionDetails, contactUrl) {
        return request({
            headers: {
                authorization: `Bearer ${connectionDetails.token}`,
            },
            json: true,
            method: 'GET',
            url: contactUrl,
        })
            .then((contact) => {
            return contact.name;
        });
    }
    static fetchSubject(connectionDetails, conversation) {
        if (conversation.subject) {
            return Promise.resolve(conversation.subject);
        }
        const contactUrl = conversation.recipient._links.related.contact;
        if (contactUrl) {
            return FrontTranslator.fetchContactName(connectionDetails, contactUrl)
                .then((name) => {
                return `Conversation with ${name}`;
            });
        }
        return Promise.resolve(`Conversation ID ${conversation.id}`);
    }
    static fetchUserId(token, username) {
        return request({
            headers: {
                authorization: `Bearer ${token}`,
            },
            json: true,
            method: 'GET',
            url: 'https://api2.frontapp.com/teammates',
        })
            .then((teammates) => {
            const loweredUsername = username.toLowerCase();
            const substitutedUsername = loweredUsername.replace('-', '_');
            const teammate = _.find(teammates._results, (eachTeammate) => {
                return eachTeammate.username.toLowerCase() === substitutedUsername;
            });
            return teammate && teammate.id;
        });
    }
    static updateTagsIntoEmit(message) {
        const threadId = message.target.thread;
        if (!threadId) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot update tags without a thread.'));
        }
        const tags = message.details.tags;
        if (!_.isArray(tags)) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot update tags without a tags array.'));
        }
        const updateTagsData = {
            conversation_id: threadId,
            tags,
        };
        return Promise.resolve({ method: ['conversation', 'update'], payload: updateTagsData });
    }
    static createThreadIntoEmit(connectionDetails, message) {
        if (!message.details.title) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot create a thread without a title'));
        }
        const channelMap = connectionDetails.channelPerInbox;
        if (!channelMap) {
            return Promise.reject(new translator_1.TranslatorError(2, 'Cannot translate Front threads without a channelPerInbox specified.'));
        }
        return FrontTranslator.fetchUserId(connectionDetails.token, message.target.username)
            .then((userId) => {
            const createThreadData = {
                author_id: userId,
                body: `${message.details.text}<hr />${translator_scaffold_1.TranslatorScaffold.stringifyMetadata(message, 'logo')}`,
                channel_id: channelMap[message.target.flow],
                options: {
                    archive: false,
                    tags: message.details.tags,
                },
                subject: message.details.title,
                to: [message.details.handle],
            };
            return { method: ['message', 'send'], payload: createThreadData };
        });
    }
    static createMessageIntoEmit(connectionDetails, message) {
        const threadId = message.target.thread;
        if (!threadId) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot create a comment without a thread.'));
        }
        return FrontTranslator.fetchUserId(connectionDetails.token, message.target.username)
            .then((userId) => {
            if (message.details.hidden) {
                const footer = translator_scaffold_1.TranslatorScaffold.stringifyMetadata(message, 'human');
                const createCommentData = {
                    author_id: userId,
                    body: `${message.details.text}\n${footer}`,
                    conversation_id: threadId,
                };
                return { method: ['comment', 'create'], payload: createCommentData };
            }
            const footer = translator_scaffold_1.TranslatorScaffold.stringifyMetadata(message, 'logo');
            const createMessageData = {
                author_id: userId,
                body: `${message.details.text}<hr />${footer}`,
                conversation_id: threadId,
                options: {
                    archive: false,
                },
                subject: message.details.title,
                type: 'message',
            };
            return { method: ['message', 'reply'], payload: createMessageData };
        });
    }
    static readConnectionIntoEmit(message) {
        const threadId = message.target.thread;
        if (!threadId) {
            return Promise.reject(new translator_1.TranslatorError(1, 'Cannot search for connections without a thread.'));
        }
        const readConnectionData = {
            conversation_id: threadId,
        };
        return Promise.resolve({ method: ['conversation', 'listComments'], payload: readConnectionData });
    }
    static convertReadConnectionResponse(message, response) {
        const idFinder = new RegExp(`\\[${message.source.service} thread ([\\w\\d-+\\/=]+)`);
        const matches = _.filter(response._results, (comment) => {
            return idFinder.test(comment.body);
        });
        if (matches.length > 0) {
            const thread = matches[matches.length - 1].body.match(idFinder);
            if (thread) {
                return Promise.resolve({
                    thread: thread[1],
                });
            }
        }
        return Promise.reject(new translator_1.TranslatorError(3, 'No connected thread found by querying Front.'));
    }
    static convertUpdateThreadResponse(_message, _response) {
        return Promise.resolve({});
    }
    static convertCreateThreadResponse(session, message, _response) {
        return FrontTranslator.findConversation(session, message.details.title)
            .then((conversation) => {
            return Promise.resolve({
                thread: conversation,
                url: `https://app.frontapp.com/open/${conversation}`,
            });
        });
    }
    eventIntoMessage(event) {
        return Promise.props({
            inboxes: this.session.conversation.listInboxes({ conversation_id: event.rawEvent.conversation.id }),
            event: request({
                headers: {
                    authorization: `Bearer ${this.connectionDetails.token}`,
                },
                json: true,
                method: 'GET',
                url: `https://api2.frontapp.com/events/${event.rawEvent.id}`,
            }),
        })
            .then((firstPhase) => {
            return Promise.props({
                subject: FrontTranslator.fetchSubject(this.connectionDetails, firstPhase.event.conversation),
                author: FrontTranslator.fetchAuthorName(this.connectionDetails, firstPhase.event.target.data),
            })
                .then((secondPhase) => {
                return {
                    inboxes: firstPhase.inboxes,
                    event: firstPhase.event,
                    subject: secondPhase.subject,
                    author: secondPhase.author,
                };
            });
        })
            .then((details) => {
            const message = details.event.target.data;
            const metadataFormat = details.event.type === 'comment' ? 'human' : 'logo';
            const metadata = translator_scaffold_1.TranslatorScaffold.extractMetadata(message.body, metadataFormat);
            const tags = _.map(details.event.conversation.tags, (tag) => {
                return tag.name;
            });
            const cookedEvent = {
                details: {
                    genesis: metadata.genesis || event.source,
                    handle: details.author,
                    hidden: _.includes(['comment', 'mention'], details.event.type),
                    internal: (message.author !== null) && /^tea_/.test(message.author.id),
                    tags,
                    text: message.text || metadata.content,
                    title: details.subject,
                },
                source: {
                    service: event.source,
                    message: message.id,
                    flow: details.inboxes._results[0].id,
                    thread: details.event.conversation.id,
                    url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
                    username: details.author,
                },
            };
            console.log(cookedEvent);
            return {
                context: `${event.source}.${event.cookedEvent.context}`,
                type: this.eventIntoMessageType(event),
                cookedEvent,
                rawEvent: event.rawEvent,
                source: event.source,
            };
        });
    }
    messageIntoEmitterConstructor(_message) {
        return Promise.resolve({
            token: this.connectionDetails.token,
            type: 1,
        });
    }
    mergeGenericDetails(connectionDetails, genericDetails) {
        if (connectionDetails.server === undefined) {
            connectionDetails.server = genericDetails.server;
        }
        connectionDetails.server = connectionDetails.server !== undefined ? connectionDetails.server : genericDetails.server;
        if (connectionDetails.type === undefined) {
            connectionDetails.type = genericDetails.type;
        }
        return connectionDetails;
    }
}
FrontTranslator.findConversation = (session, subject, delay = 50, maxDelay = 60000) => {
    return session.conversation.list()
        .then((conversations) => {
        const conversationsMatched = _.filter(conversations._results, (eachConversation) => {
            return eachConversation.subject === subject;
        });
        if (conversationsMatched.length > 0) {
            return Promise.resolve(conversationsMatched[0].id);
        }
        if (delay > maxDelay) {
            return Promise.reject(new translator_1.TranslatorError(0, 'Tried loads of times to find the conversation.'));
        }
        return Promise.delay(delay, FrontTranslator.findConversation(session, subject, delay * (Math.random() + 1.5), maxDelay));
    });
};
exports.FrontTranslator = FrontTranslator;
function createTranslator(data) {
    return new FrontTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=front.js.map
