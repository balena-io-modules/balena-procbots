"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const front_sdk_1 = require("front-sdk");
const _ = require("lodash");
const request = require("request-promise");
const Translator = require("./translator");
class FrontTranslator {
    constructor(data, hub) {
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
        this.hub = hub;
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
            const metadata = Translator.extractMetadata(message.text || message.body, 'emoji');
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
                details: {
                    genesis: metadata.genesis || event.source,
                    hidden: first ? metadata.hidden : details.event.type === 'comment',
                    text: metadata.content,
                    title: details.event.conversation.subject,
                },
                source: {
                    service: event.source,
                    flow: details.inboxes._results[0].id,
                    message: message.id,
                    thread: details.event.conversation.id,
                    url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
                    user: author,
                },
            };
            return {
                cookedEvent: {
                    context: `${event.source}.${event.cookedEvent.context}`,
                    event: 'message',
                },
                rawEvent,
                source: 'messenger',
            };
        });
    }
    messageIntoEmitCreateMessage(message) {
        const conversationId = message.target.thread;
        if (!conversationId) {
            const subject = message.details.title;
            if (!subject) {
                throw new Error('Cannot create Front Conversation without a title');
            }
            return this.fetchUserId(message.target.user).then((userId) => {
                return {
                    action: 'send',
                    objectType: 'message',
                    payload: {
                        author_id: userId,
                        body: `${message.details.text}<hr/><br/>${Translator.stringifyMetadata(message, 'plaintext')}`,
                        channel_id: this.channelPerInbox[message.target.flow],
                        metadata: {
                            thread_ref: message.source.thread,
                        },
                        options: {
                            archive: false,
                        },
                        sender: {
                            handle: message.target.user,
                        },
                        subject,
                        to: [message.source.user],
                    }
                };
            });
        }
        return Promise.props({
            conversation: this.session.conversation.get({ conversation_id: conversationId }),
            userId: this.fetchUserId(message.target.user)
        }).then((details) => {
            if (message.details.hidden) {
                return {
                    action: 'create',
                    objectType: 'comment',
                    payload: {
                        author_id: details.userId,
                        body: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message, 'plaintext')}`,
                        conversation_id: conversationId,
                    }
                };
            }
            return {
                action: 'reply',
                objectType: 'message',
                payload: {
                    author_id: details.userId,
                    body: `${message.details.text}<hr/><br/>${Translator.stringifyMetadata(message, 'plaintext')}`,
                    conversation_id: conversationId,
                    options: {
                        archive: false,
                    },
                    subject: details.conversation.subject,
                    type: message.details.hidden ? 'comment' : 'message',
                }
            };
        });
    }
    messageIntoEmitReadThread(message, _shortlist) {
        return Promise.resolve({
            action: 'listComments',
            objectType: 'conversation',
            payload: {
                conversation_id: message.source.thread,
            },
        });
    }
    eventNameIntoTriggers(name) {
        const equivalents = {
            message: ['out_reply'],
        };
        return equivalents[name];
    }
    getAllTriggers() {
        return ['out_reply'];
    }
}
exports.FrontTranslator = FrontTranslator;
function createTranslator(data, hub) {
    return new FrontTranslator(data, hub);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=front.js.map
