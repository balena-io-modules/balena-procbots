/*
 Copyright 2016-2017 Resin.io

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import * as Promise from 'bluebird';
import {
	EmailReplyParser
} from 'emailreplyparser';
import {
	CommentRequest,
	Contact,
	Conversation,
	ConversationComments,
	ConversationInboxes,
	ConversationMessages,
	ConversationRequest,
	Conversations,
	Event,
	Front,
	MessageRequest,
} from 'front-sdk';
import * as _ from 'lodash';
import * as marked from 'marked';
import * as moment from 'moment';
import { Logger, LogLevel } from '../../../utils/logger';
import { FrontConstructor, FrontEmitInstructions, FrontResponse, FrontServiceEvent } from '../../front-types';
import {
	BasicEventInformation,
	CreateThreadResponse,
	MessengerAction,
	MessengerConstructor,
	MessengerEvent,
	ReceiptInformation,
	SourceDescription,
	TransmitInformation,
	UpdateThreadResponse,
} from '../../messenger-types';
import { ServiceType } from '../../service-types';
import { Translator, TranslatorError } from './translator';
import { MetadataEncoding, TranslatorScaffold } from './translator-scaffold';
import {
	EmitConverters,
	MetadataConfiguration,
	ResponseConverters,
	TranslatorErrorCode,
	TranslatorMetadata,
} from './translator-types';

/**
 * Class to enable the translating between messenger standard forms and service
 * specific forms.
 */
export class FrontTranslator extends TranslatorScaffold implements Translator {
	public static extractReply(email: string): string {
		const newFragments = _.filter(EmailReplyParser.read(email).fragments, { quoted: false });
		return _.map(newFragments, 'content').join('\n');
	}

	/**
	 * Converts a provided username, in service specific format, into a generic username
	 * @param username  Username to convert
	 * @returns         Generic equivalent of that username
	 */
	public static convertUsernameToGeneric(username: string): string {
		return username.replace(/_/g, '-');
	}

	/**
	 * Converts a provided username, in generic format, into a service specific username
	 * @param username  Username to convert
	 * @returns         Discourse equivalent of that username
	 */
	public static convertUsernameToFront(username: string): string {
		return username.replace(/-/g, '_');
	}

	/**
	 * Converts a provided message object into instructions to archive the thread.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	public static archiveThreadIntoEmit(message: TransmitInformation): Promise<FrontEmitInstructions> {
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot archive a thread without a thread.'
			));
		}
		const archiveThreadData: ConversationRequest.Update = {
			conversation_id: threadId,
			status: 'archived',
		};
		return Promise.resolve({
			method: ['conversation', 'update'],
			payload: archiveThreadData
		});
	}

	/**
	 * Converts a response into the generic format.
	 * @param metadataConfig  Configuration that may have been used to encode metadata.
	 * @param event           The initial message that prompted this action.
	 * @param response        The response from the SDK.
	 * @returns               Promise that resolve to the thread details.
	 */
	public static convertReadConnectionResponse(
		metadataConfig: MetadataConfiguration, event: BasicEventInformation, response: ConversationComments
	): Promise<SourceDescription> {
		return Promise.resolve(TranslatorScaffold.extractSource(
			event.current,
			_.reverse(_.map(response._results, (comment) => { return comment.body; })),
			metadataConfig,
			MetadataEncoding.HiddenMD,
		));
	}

	/**
	 * Converts a response into the generic format.
	 * @param _message  The initial message that prompted this action.
	 * @param response  The response from the SDK.
	 * @returns         Promise that resolve to the thread details.
	 */
	public static convertReadErrorResponse(
		_message: TransmitInformation, response: ConversationComments
	): Promise<String[]> {
		return Promise.resolve(_.reverse(_.map(response._results, (comment) => comment.body )));
	}

	/**
	 * Converts a response into the generic format.
	 * @param _message  The initial message that prompted this action.
	 * @param response  The response from the SDK.
	 * @returns         Promise that resolve to the thread details.
	 */
	public static convertListWhispersResponse(
		metadataConfig: MetadataConfiguration, _message: TransmitInformation, response: ConversationComments
	): Promise<TranslatorMetadata[]> {
		const rawComments = _.reverse(_.map(response._results, (comment) => comment.body ));
		return Promise.resolve(_.map(rawComments, (commentObject) => {
			return FrontTranslator.extractMetadata(commentObject, MetadataEncoding.HiddenMD, metadataConfig);
		}));
	}

	/**
	 * Converts a response into the generic format.
	 * @param _message  The initial message that prompted this action.
	 * @param response  The response from the SDK.
	 * @returns         Promise that resolve to the thread details.
	 */
	public static convertListRepliesResponse(
		metadataConfig: MetadataConfiguration, _message: TransmitInformation, response: ConversationComments
	): Promise<TranslatorMetadata[]> {
		const rawComments = _.reverse(_.map(response._results, (comment) => comment.body ));
		return Promise.resolve(_.map(rawComments, (commentObject) => {
			return FrontTranslator.extractMetadata(commentObject, MetadataEncoding.HiddenHTML, metadataConfig);
		}));
	}

	/**
	 * Promises to find the name of the source individual of the event.
	 * @param session  Session to interrogate.
	 * @param event    Details of the event we care about.
	 * @returns        Promise that resolves to the name of the author.
	 */
	private static fetchAuthorName(session: Front, event: Event): Promise<string> {
		if (event.source._meta.type === 'teammate' && !_.isNil(event.source.data) && !_.isNil(event.source.data.username)) {
			return Promise.resolve(FrontTranslator.convertUsernameToGeneric(event.source.data.username));
		}
		const target = _.get(event, ['target', 'data'], {});
		if (target.author) {
			return Promise.resolve(FrontTranslator.convertUsernameToGeneric(target.author.username));
		}
		for (const recipient of _.get(target, ['recipients'], [])) {
			if (recipient.role === 'from') {
				const contactUrl = recipient._links.related.contact;
				if (contactUrl) {
					return FrontTranslator.fetchContactName(session, contactUrl);
				}
				return Promise.resolve(FrontTranslator.convertUsernameToGeneric(recipient.handle));
			}
		}
		return Promise.resolve('Unknown Author');
	}

	/**
	 * Promises to fetch the name from a provided contact (ctc_blah) url.
	 * @param session     Session to interrogate.
	 * @param contactUrl  Url of the contact to fetch.
	 * @returns           Promise that resolves to the name of the contact.
	 */
	private static fetchContactName(session: Front, contactUrl: string): Promise<string> {
		return session.getFromLink(contactUrl)
		.then((contact: Contact) => {
			return contact.name || contact.handles[0].handle;
		});
	}

	/**
	 * Promises to fetch the subject of a conversation
	 * @param session       Session to interrogate.
	 * @param conversation  Details of the conversation we care about.
	 * @returns             Promise that resolves to the subject line of the conversation.
	 */
	private static fetchSubject(
		session: Front, conversation: Conversation
	): Promise<string> {
		if (conversation.subject) {
			return Promise.resolve(conversation.subject);
		}
		const contactUrl = conversation.recipient._links.related.contact;
		if (contactUrl) {
			return FrontTranslator.fetchContactName(session, contactUrl)
			.then((name: string) => {
				return `Conversation with ${name}`;
			});
		}
		return Promise.resolve(`Conversation ID ${conversation.id}`);
	}

	/**
	 * Internal function to retrieve the ID for a particular username.
	 * ... only needed because on the way into Front events use ID, but on their way out use username.
	 * @param session   Session to interrogate.
	 * @param username  Username to search for.
	 * @returns         Promise that resolves to the user ID.
	 */
	private static fetchUserId(session: Front, username: string): Promise<string|undefined> {
		return session.teammate.list()
		.then((teammates) => {
			const loweredUsername = username.toLowerCase();
			const substitutedUsername = FrontTranslator.convertUsernameToFront(loweredUsername);
			const teammate = _.find(teammates._results, (eachTeammate: { username: string, id: string }) => {
				return eachTeammate.username.toLowerCase() === substitutedUsername;
			});
			return teammate && teammate.id;
		});
	}

	/**
	 * An internal function that converts a conversation subject into a conversation ID
	 * ... only needed because the Front channel structure clashes with its comment endpoint.
	 * (the one only knows about external or reference, the other only knows about ID)
	 * @param session   Session to interrogate
	 * @param subject   Subject line to search for.
	 * @param delay     Increasing time between attempts, starts by default at 50ms.
	 * @param maxDelay  A threshold that once the delay reaches this long we should give up.
	 * @returns         Promise that resolves to the conversation ID.
	 */
	private static findConversation = (
		// Note that sometimes conversations can take up to 15 minutes to index.
		session: Front, subject: string, delay: number = 50, maxDelay: number = 15 * 60 * 1000
	): Promise<string> => {
		return session.conversation.list()
		.then((conversations: Conversations) => {
			const conversationsMatched = _.filter(conversations._results, (eachConversation: Conversation) => {
				return eachConversation.subject === subject;
			});
			if (conversationsMatched.length > 0) {
				return Promise.resolve(conversationsMatched[0].id);
			}
			if (delay > maxDelay) {
				return Promise.reject(new TranslatorError(
					TranslatorErrorCode.WebServiceError, 'Tried loads of times to find the conversation.'
				));
			}
			return Promise.delay(
				Math.ceil(delay),
				FrontTranslator.findConversation(session, subject, delay * (Math.random() + 1.5), maxDelay)
			);
		});
	}

	/**
	 * Converts a provided message object into instructions to update tags.
	 * @param event    object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static updateTagsIntoEmit(event: TransmitInformation): Promise<FrontEmitInstructions> {
		// Check we have a thread.
		const threadId = event.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot update tags without a thread.'
			));
		}
		// Check we have an array of tags.
		const tags = event.details.thread.tags;
		if (!_.isArray(tags)) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot update tags without a tags array.'
			));
		}
		// Bundle it for the session.
		const updateTagsData: ConversationRequest.Update = {
			conversation_id: threadId,
			tags,
		};
		return Promise.resolve({
			method: ['conversation', 'update'],
			payload: updateTagsData
		});
	}

	/**
	 * Converts a provided message object into instructions to create a thread.
	 * @param session         Session to interrogate.
	 * @param channelMap      Map of inbox ids to channel ids
	 * @param metadataConfig  Configuration to use to encode metadata
	 * @param event           object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createThreadIntoEmit(
		session: Front,
		channelMap: {[inbox: string]: string},
		metadataConfig: MetadataConfiguration,
		event: TransmitInformation,
	): Promise<FrontEmitInstructions> {
		// Check we have a title.
		if (!event.details.thread.title) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a thread without a title'
			));
		}
		const messageDetails = event.details.message;
		if (!messageDetails) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot emit an absent message.'
			));
		}
		// Gather the ID for the user.
		return FrontTranslator.fetchUserId(session, event.target.username)
		.then((userId) => {
			// Bundle for the session.
			const metadataString = TranslatorScaffold.stringifyMetadata(
				messageDetails,
				event.current,
				MetadataEncoding.HiddenHTML,
				metadataConfig,
			);
			const converter = FrontTranslator.convertUsernameToFront;
			const messageString = TranslatorScaffold.convertPings(messageDetails.text, converter);
			const createThreadData: MessageRequest.Send = {
				author_id: userId,
				body: `${marked(messageString)}<br />${metadataString}`,
				channel_id: channelMap[event.target.flow],
				options: {
					archive: false,
					tags: event.details.thread.tags,
				},
				sender_name: event.target.username,
				subject: event.details.thread.title,
				to: [event.details.user.handle],
			};
			return {
				method: ['message', 'send'],
				payload: createThreadData
			};
		});
	}

	/**
	 * Converts a provided message object into instructions to create a message.
	 * @param session         Details of the connection to find things user ID.
	 * @param metadataConfig  Configuration to use to encode metadata
	 * @param event           object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createMessageIntoEmit(
		session: Front, metadataConfig: MetadataConfiguration, event: TransmitInformation
	): Promise<FrontEmitInstructions> {
		// Check we have a thread.
		const threadId = event.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a comment without a thread.'
			));
		}
		const messageDetails = event.details.message;
		if (!messageDetails) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot emit an absent message.'
			));
		}
		// Gather the user ID for the username.
		return FrontTranslator.fetchUserId(session, event.target.username)
		.then((userId: string) => {
			// Bundle a 'comment', which is private, for the session.
			if (messageDetails.hidden) {
				const metadataInjection = TranslatorScaffold.stringifyMetadata(
					messageDetails,
					event.current,
					MetadataEncoding.HiddenMD,
					metadataConfig,
				);
				const converter = FrontTranslator.convertUsernameToFront;
				const messageString = TranslatorScaffold.convertPings(messageDetails.text, converter);
				const createCommentData: CommentRequest.Create = {
					author_id: userId,
					body: `${messageString}\n${metadataInjection}`,
					conversation_id: threadId,
				};
				if (event.details.thread.title) {
					createCommentData.subject = event.details.thread.title;
				}
				return {
					method: ['comment', 'create'],
					payload: createCommentData
				};
			}
			// Bundle a 'reply', which is public, for the session.
			const metadataInjection = TranslatorScaffold.stringifyMetadata(
				messageDetails,
				event.current,
				MetadataEncoding.HiddenHTML,
				metadataConfig,
			);
			const converter = FrontTranslator.convertUsernameToFront;
			const messageString = TranslatorScaffold.convertPings(messageDetails.text, converter);
			const messageHTML = marked(
				messageString,
				{
					gfm: true, // github-flavoured-markdown
					breaks: true, // with line breaks and paragraphs
				},
			);
			const createMessageData: MessageRequest.Reply = {
				author_id: userId,
				body: `${messageHTML}${metadataInjection}`,
				conversation_id: threadId,
				options: {
					archive: false,
				},
				sender_name: event.target.username,
				type: 'message',
			};
			if (event.details.thread.title) {
				createMessageData.subject = event.details.thread.title;
			}
			return {
				method: ['message', 'reply'],
				payload: createMessageData
			};
		});
	}

	/**
	 * Converts a provided message object into instructions to list a thread's comments.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static listWhispersIntoEmit(message: TransmitInformation): Promise<FrontEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot search for connections without a thread.'
			));
		}
		// Bundle it for the session.
		const readConnectionData: ConversationRequest.ListComments = {
			conversation_id: threadId,
		};
		return Promise.resolve({
			method: ['conversation', 'listComments'],
			payload: readConnectionData
		});
	}

	/**
	 * Converts a provided message object into instructions to list a thread's messages.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static listRepliesIntoEmit(message: TransmitInformation): Promise<FrontEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot search for connections without a thread.'
			));
		}
		// Bundle it for the session.
		const readConnectionData: ConversationRequest.List = {
			conversation_id: threadId,
		};
		return Promise.resolve({
			method: ['conversation', 'listMessages'],
			payload: readConnectionData
		});
	}

	/**
	 * Converts a response into the generic format.
	 * @param _message   Not used, the initial message that prompted this action.
	 * @param _response  Not used, the response from the SDK.
	 * @returns          Promise that resolve to the thread details.
	 */
	private static convertUpdateThreadResponse(
		_message: TransmitInformation, _response: FrontResponse
	): Promise<UpdateThreadResponse> {
		return Promise.resolve({});
	}

	/**
	 * Converts a response into the generic format.
	 * @param session    Session to query for conversation details.
	 * @param event      The initial message that prompted this action.
	 * @param _response  The response from the SDK.
	 * @returns          Promise that resolve to the thread details.
	 */
	private static convertCreateThreadResponse(
		session: Front, event: TransmitInformation, _response: FrontResponse
	): Promise<CreateThreadResponse> {
		// Check we have a title.
		if (!event.details.thread.title) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Could not have created a thread without a title'
			));
		}
		// The creation of a conversation returns a conversation_reference which is compartmentalised.
		// It bears no relation to anything understood by any other part of Front.
		// So we go diving through the recent conversations for a matching subject line.
		return FrontTranslator.findConversation(session, event.details.thread.title)
		.then((conversation: string) => {
			return Promise.resolve({
				thread: conversation,
				url: `https://app.frontapp.com/open/${conversation}`,
			});
		});
	}

	protected eventEquivalencies = {
		message: [
			'comment', 'out_reply', 'inbound',
			'mention', 'move', 'outbound',
			'archive', 'reopen', 'assign',
			'unassign'
		],
	};
	protected emitConverters: EmitConverters = {
		[MessengerAction.ReadConnection]: FrontTranslator.listWhispersIntoEmit,
		[MessengerAction.ReadErrors]: FrontTranslator.listWhispersIntoEmit,
		[MessengerAction.UpdateTags]: FrontTranslator.updateTagsIntoEmit,
		[MessengerAction.ArchiveThread]: FrontTranslator.archiveThreadIntoEmit,
		[MessengerAction.ListReplies]: FrontTranslator.listWhispersIntoEmit,
		[MessengerAction.ListWhispers]: FrontTranslator.listRepliesIntoEmit,
	};
	protected responseConverters: ResponseConverters = {
		[MessengerAction.UpdateTags]: FrontTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateMessage]: FrontTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateConnection]: FrontTranslator.convertUpdateThreadResponse,
		[MessengerAction.ArchiveThread]: FrontTranslator.convertUpdateThreadResponse,
		[MessengerAction.ReadErrors]: FrontTranslator.convertReadErrorResponse,
	};

	private readonly session: Front;
	private readonly token: string;
	private loggerInstance: Logger;

	constructor(data: FrontConstructor, metadataConfig: MetadataConfiguration) {
		super(metadataConfig);
		this.loggerInstance = new Logger();
		this.session = new Front(data.token);
		this.token = data.token;
		this.responseConverters[MessengerAction.CreateThread] =
			_.partial(FrontTranslator.convertCreateThreadResponse, this.session);
		this.responseConverters[MessengerAction.ReadConnection] =
			_.partial(FrontTranslator.convertReadConnectionResponse, this.metadataConfig);
		this.responseConverters[MessengerAction.ListReplies] =
			_.partial(FrontTranslator.convertListRepliesResponse, this.metadataConfig);
		this.responseConverters[MessengerAction.ListWhispers] =
			_.partial(FrontTranslator.convertListWhispersResponse, this.metadataConfig);
		this.emitConverters[MessengerAction.CreateMessage] =
			_.partial(FrontTranslator.createMessageIntoEmit, this.session, metadataConfig);
		this.emitConverters[MessengerAction.CreateConnection] =
			_.partial(FrontTranslator.createMessageIntoEmit, this.session, metadataConfig);
		this.emitConverters[MessengerAction.CreateThread] =
			_.partial(FrontTranslator.createThreadIntoEmit, this.session, data.channelPerInbox, metadataConfig);
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to an array of message objects in the standard form
	 */
	public eventIntoMessages(event: FrontServiceEvent): Promise<MessengerEvent[]> {
		this.loggerInstance.log(LogLevel.INFO, 'Logging Front event');
		this.loggerInstance.log(LogLevel.INFO, JSON.stringify(event));

		const rawEvent: any = event.rawEvent;
		return Promise.props({
			inboxes: this.session.conversation.listInboxes({conversation_id: rawEvent.conversation.id}),
			comments: this.session.conversation.listComments({conversation_id: rawEvent.conversation.id}),
			messages: this.session.conversation.listMessages({conversation_id: rawEvent.conversation.id}),
			event: rawEvent,
			subject: FrontTranslator.fetchSubject(this.session, rawEvent.conversation),
			author: FrontTranslator.fetchAuthorName(this.session, rawEvent),
		})
		.then((details: {
			inboxes: ConversationInboxes,
			comments: ConversationComments,
			messages: ConversationMessages,
			event: any,
			subject: string,
			author: string
		}) => {
			this.loggerInstance.log(LogLevel.INFO, 'Logging Front details for event');
			this.loggerInstance.log(LogLevel.INFO, JSON.stringify(details));
			// Extract some details from the event.
			const hidden = _.includes(['comment', 'mention'], details.event.type);
			const metadataFormat = hidden ? MetadataEncoding.HiddenMD : MetadataEncoding.HiddenHTML;
			let metadata = TranslatorScaffold.emptyMetadata();
			switch (details.event.type) {
				// Be a bit careful when adding cases to this. `details.event.type` is embedded within a sentence so
				// English grammar must be considered.
				case 'move':
				case 'archive':
					metadata = TranslatorScaffold.emptyMetadata(`This thread was ${details.event.type}d by ${details.author}.`);
					metadata.hidden = 'preferred';
					break;
				case 'reopen':
					metadata = TranslatorScaffold.emptyMetadata(`This thread was ${details.event.type}ed by ${details.author}.`);
					metadata.hidden = 'preferred';
					break;
				case 'comment':
				case 'out_reply':
				case 'inbound':
				case 'mention':
				case 'outbound':
					// Find the metadata from the post created
					metadata = TranslatorScaffold.extractMetadata(details.event.target.data.body, metadataFormat, this.metadataConfig);
					break;
				default:
					metadata = TranslatorScaffold.emptyMetadata('An unrecognised event happened on this thread.');
					metadata.hidden = true;
			}
			const duffFlow = 'duff_FrontTranslator_eventIntoMessages_b';
			const tags = _.map(details.event.conversation.tags, (tag: {name: string}) => {
				return tag.name;
			});
			// Bundle it in service scaffold form and resolve.
			const isIntercom = details.event.target && (details.event.target.data.type === 'intercom');
			const cookedEvent: ReceiptInformation = {
				details: {
					user: {
						handle: details.author,
					},
					thread: {
						tags,
						title: details.subject,
						messageCount: details.messages._results.length + details.comments._results.length,
						states: {
							archived: details.event.conversation.status === 'archived',
							open: details.event.conversation.status === 'unassigned',
							assigned: details.event.conversation.status === 'assigned',
						}
					}
				},
				current: {
					// https://github.com/resin-io-modules/resin-procbots/issues/301
					intercomHack: isIntercom ? details.event.conversation.subject.replace(/^Re:\s+/, '') !== '' : undefined,
					service: event.source,
					message: details.event.id,
					flow: 'duff_FrontTranslator_eventIntoMessages_a', // Gets replaced
					thread: details.event.conversation.id,
					url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
					username: details.author,
				},
				source: {
					service: metadata.service || event.source,
					flow: metadata.flow || duffFlow, // Gets replaced
					thread: metadata.thread || details.event.conversation.id,
					message: details.event.id,
					url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
					username: details.author,
				}
			};
			if (_.includes(['comment', 'out_reply', 'inbound', 'mention', 'move', 'outbound'], details.event.type)) {
				const body = (details.event.target && details.event.target.data.text) || metadata.content;
				const reply = _.includes(['inbound'], details.event.type) ? FrontTranslator.extractReply(body) : body;
				const text = TranslatorScaffold.convertPings(reply, FrontTranslator.convertUsernameToGeneric);
				cookedEvent.details.message = {
					hidden: _.isSet(metadata.hidden) ? metadata.hidden : hidden,
					text,
					time: moment.unix(details.event.emitted_at).toISOString(),
				};
			}
			return _.map(details.inboxes._results, (inbox) => {
				const recookedEvent = _.cloneDeep(cookedEvent);
				recookedEvent.current.flow = inbox.id;
				if (recookedEvent.source.flow === duffFlow) {
					recookedEvent.source.flow = inbox.id;
				}
				return {
					context: `${event.source}.${event.context}`,
					type: this.eventIntoMessageType(event),
					cookedEvent: recookedEvent,
					rawEvent: event.rawEvent,
					source: event.source,
				};
			});
		});
	}

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param _message  Message information, not used.
	 * @returns         The details required to construct an emitter.
	 */
	public messageIntoEmitterConstructor(_message: TransmitInformation): FrontConstructor {
		return {
			serviceName: 'front',
			token: this.token,
			type: ServiceType.Emitter,
		};
	}

	/**
	 * Populate the listener constructor with details from the more generic constructor.
	 * Provided since the connectionDetails might need to be parsed from JSON and the server details might be instantiated.
	 * @param connectionDetails  Construction details for the service, probably 'inert', ie from JSON.
	 * @param genericDetails     Details from the construction of the messenger.
	 * @returns                  Connection details with the value merged in.
	 */
	public mergeGenericDetails(
		connectionDetails: FrontConstructor, genericDetails: MessengerConstructor
	): FrontConstructor {
		if (connectionDetails.ingress === undefined) {
			connectionDetails.ingress = genericDetails.ingress;
		}
		if (connectionDetails.type === undefined) {
			connectionDetails.type = genericDetails.type;
		}
		return connectionDetails;
	}
}

/**
 * Builds a translator that will convert Front specific information to and from Messenger format.
 * @param data            Construction details for creating a Front session.
 * @param metadataConfig  Configuration of how the translator should encode metadata
 * @returns               A translator, ready to interpret Front's babbling
 */
export function createTranslator(data: FrontConstructor, metadataConfig: MetadataConfiguration): Translator {
	return new FrontTranslator(data, metadataConfig);
}
