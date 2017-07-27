"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const front_sdk_1 = require("front-sdk");
const _ = require("lodash");
const request = require("request-promise");
const messenger_types_1 = require("../../services/messenger-types");
const Translator = require("./translator");
class FrontTranslator {
    constructor(data) {
        this.fetchUserId = (username) => {
            const getTeammates = {
                headers: {
                    authorization: `Bearer ${this.token}`
                },
                json: true,
                method: 'GET',
                uri: 'https://api2.frontapp.com/teammates',
            };
            return request(getTeammates).then((teammates) => {
                const teammate = _.find(teammates._results, (eachTeammate) => {
                    return eachTeammate.username === username;
                });
                if (teammate) {
                    return teammate.id;
                }
            });
        };
        this.session = new front_sdk_1.Front(data.token);
        this.token = data.token;
        this.channelPerInbox = data.channelPerInbox || {};
    }
    eventIntoMessage(event) {
        const getGeneric = {
            headers: {
                authorization: `Bearer ${this.token}`
            },
            json: true,
            method: 'GET',
            uri: '',
        };
        const getEvent = _.cloneDeep(getGeneric);
        getEvent.uri = `https://api2.frontapp.com/events/${event.rawEvent.id}`;
        const getInboxes = _.cloneDeep(getGeneric);
        getInboxes.uri = `https://api2.frontapp.com/conversations/${event.rawEvent.conversation.id}/inboxes`;
        const getMessages = _.cloneDeep(getGeneric);
        getMessages.uri = `https://api2.frontapp.com/conversations/${event.rawEvent.conversation.id}/messages`;
        const getComments = _.cloneDeep(getGeneric);
        getComments.uri = `https://api2.frontapp.com/conversations/${event.rawEvent.conversation.id}/comments`;
        return Promise.props({
            comments: request(getComments),
            event: request(getEvent),
            inboxes: request(getInboxes),
            messages: request(getMessages),
        })
            .then((details) => {
            const message = details.event.target.data;
            const first = details.comments._results.length + details.messages._results.length === 1;
            const metadata = Translator.extractMetadata(message.text || message.body);
            let author = 'Unknown';
            if (message.author) {
                author = message.author.username;
            }
            else {
                for (const recipient of message.recipients) {
                    if (recipient.role === 'from') {
                        author = recipient.handle;
                    }
                }
            }
            const rawEvent = {
                action: messenger_types_1.MessageAction.Create,
                first,
                genesis: metadata.genesis || event.source,
                hidden: first ? metadata.hidden : details.event.type === 'comment',
                source: event.source,
                sourceIds: {
                    flow: details.inboxes._results[0].id,
                    message: message.id,
                    thread: details.event.conversation.id,
                    url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
                    user: author,
                },
                text: metadata.content,
                title: details.event.conversation.subject,
            };
            return {
                cookedEvent: {
                    context: `front.${event.cookedEvent.context}`,
                    event: 'message',
                },
                rawEvent,
                source: event.source,
            };
        });
    }
    messageIntoEmitCreateMessage(message) {
        const conversationId = message.toIds.thread;
        if (!conversationId) {
            const subject = message.title;
            if (!subject) {
                throw new Error('Cannot create Front Conversation without a title');
            }
            return this.fetchUserId(message.toIds.user).then((userId) => {
                return {
                    action: 'send',
                    objectType: 'message',
                    payload: {
                        author_id: userId,
                        body: `${message.text}<hr/><br/>${Translator.stringifyMetadata(message, 'plaintext')}`,
                        channel_id: this.channelPerInbox[message.toIds.flow],
                        metadata: {
                            thread_ref: message.sourceIds.thread,
                        },
                        options: {
                            archive: false,
                        },
                        sender: {
                            handle: message.toIds.user,
                        },
                        subject,
                        to: [message.sourceIds.user],
                    }
                };
            });
        }
        return Promise.props({
            conversation: this.session.conversation.get({ conversation_id: conversationId }),
            userId: this.fetchUserId(message.toIds.user)
        }).then((details) => {
            if (message.hidden) {
                return {
                    action: 'create',
                    objectType: 'comment',
                    payload: {
                        author_id: details.userId,
                        body: `${message.text}\n\n---\n${Translator.stringifyMetadata(message, 'plaintext')}`,
                        conversation_id: conversationId,
                    }
                };
            }
            return {
                action: 'reply',
                objectType: 'message',
                payload: {
                    author_id: details.userId,
                    body: `${message.text}<hr/><br/>${Translator.stringifyMetadata(message, 'plaintext')}`,
                    conversation_id: conversationId,
                    options: {
                        archive: false,
                    },
                    subject: details.conversation.subject,
                    type: message.hidden ? 'comment' : 'message',
                }
            };
        });
    }
    messageIntoEmitReadThread(message, _shortlist) {
        return Promise.resolve({
            action: 'listComments',
            objectType: 'conversation',
            payload: {
                conversation_id: message.sourceIds.thread,
            },
        });
    }
    eventNameIntoTriggers(name) {
        const equivalents = {
            message: ['event'],
        };
        return equivalents[name];
    }
    getAllTriggers() {
        return ['event'];
    }
}
exports.FrontTranslator = FrontTranslator;
function createTranslator(data) {
    return new FrontTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=front.js.map
