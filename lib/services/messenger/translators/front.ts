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
	CommentRequest, Conversation, ConversationComments,
	ConversationInboxes, ConversationRequest, Conversations,
	Front, Message, MessageRequest,
} from 'front-sdk';
import * as _ from 'lodash';
import * as request from 'request-promise';
import { FrontConstructor, FrontEmitInstructions, FrontResponse } from '../../front-types';
import {
	BasicMessageInformation, CreateThreadResponse, IdentifyThreadResponse,
	MessengerAction, MessengerConstructor, MessengerEvent, TransmitInformation,
	UpdateThreadResponse,
} from '../../messenger-types';
import { ServiceScaffoldEvent } from '../../service-scaffold-types';
import { ServiceType } from '../../service-types';
import { Translator, TranslatorError } from './translator';
import { TranslatorScaffold } from './translator-scaffold';
import { EmitConverters, ResponseConverters, TranslatorErrorCode } from './translator-types';

/**
 * Class to enable the translating between messenger standard forms and service
 * specific forms.
 */
export class FrontTranslator extends TranslatorScaffold implements Translator {
	/**
	 * Find the author from the various places Front squirrels it away.
	 * @param message  Event to analyse.
	 * @returns        username or handle from Front.
	 */
	private static extractAuthorDetails(message: Message): { username: string, internal: boolean } {
		if (message.author) {
			return {
				username: message.author.username.replace('_', '-'),
				internal: !message.is_inbound,
			};
		}
		for (const recipient of message.recipients) {
			if (recipient.role === 'from') {
				return {
					username: recipient.handle.replace('_', '-'),
					internal: !message.is_inbound,
				};
			}
		}
		return {
			username: 'Unknown',
			internal: false,
		};
	}

	/**
	 * Internal function to retrieve the ID for a particular username.
	 * ... only needed because on the way into Front events use ID, but on their way out use username.
	 * @param token     Token to use for request.
	 * @param username  Username to search for.
	 * @returns         Promise that resolves to the user ID.
	 */
	private static fetchUserId(token: string, username: string): Promise<string|undefined> {
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
		session: Front, subject: string, delay: number = 50, maxDelay: number = 60000
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
				delay,
				FrontTranslator.findConversation(session, subject, delay * (Math.random() + 1.5), maxDelay)
			);
		});
	}

	/**
	 * Converts a provided message object into instructions to update tags.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static updateTagsIntoEmit(message: TransmitInformation): Promise<FrontEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot update tags without a thread.'
			));
		}
		// Check we have an array of tags.
		const tags = message.details.tags;
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
		return Promise.resolve({ method: ['conversation', 'update'], payload: updateTagsData });
	}

	/**
	 * Converts a provided message object into instructions to create a thread.
	 * @param connectionDetails  Details of the connection to find things like channels to use.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static createThreadIntoEmit(
		connectionDetails: FrontConstructor, message: TransmitInformation
	): Promise<FrontEmitInstructions> {
		// Check we have a title.
		if (!message.details.title) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a thread without a title'
			));
		}
		// Check we have a way of mapping channels.
		const channelMap = connectionDetails.channelPerInbox;
		if (!channelMap) {
			return Promise.reject(new TranslatorError(
					TranslatorErrorCode.ConfigurationError,
					'Cannot translate Front threads without a channelPerInbox specified.'
				)
			);
		}
		// Gather the ID for the user.
		return FrontTranslator.fetchUserId(connectionDetails.token, message.target.username)
		.then((userId) => {
			// Bundle for the session.
			const createThreadData: MessageRequest.Send = {
				author_id: userId,
				body: `${message.details.text}<hr />${TranslatorScaffold.stringifyMetadata(message, 'logo')}`,
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

	/**
	 * Converts a provided message object into instructions to create a message.
	 * @param connectionDetails  Details of the connection to find things user ID.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static createMessageIntoEmit(
		connectionDetails: FrontConstructor, message: TransmitInformation
	): Promise<FrontEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a comment without a thread.'
			));
		}
		// Gather the user ID for the username.
		return FrontTranslator.fetchUserId(connectionDetails.token, message.target.username)
		.then((userId: string) => {
			// Bundle a 'comment', which is private, for the session.
			if (message.details.hidden) {
				const footer = TranslatorScaffold.stringifyMetadata(message, 'human');
				const createCommentData: CommentRequest.Create = {
					author_id: userId,
					body: `${message.details.text}\n${footer}`,
					conversation_id: threadId,
				};
				return {method: ['comment', 'create'], payload: createCommentData };
			}
			// Bundle a 'reply', which is public, for the session.
			const footer = TranslatorScaffold.stringifyMetadata(message, 'logo');
			const createMessageData: MessageRequest.Reply = {
				author_id: userId,
				body: `${message.details.text}<hr />${footer}`,
				conversation_id: threadId,
				options: {
					archive: false,
				},
				subject: message.details.title,
				type: 'message',
			};
			return {method: ['message', 'reply'], payload: createMessageData };
		});
	}

	/**
	 * Converts a provided message object into instructions to read a thread for connections.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static readConnectionIntoEmit(message: TransmitInformation): Promise<FrontEmitInstructions> {
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
		return Promise.resolve({ method: ['conversation', 'listComments'], payload: readConnectionData });
	}

	/**
	 * Converts a response into the generic format.
	 * @param message   The initial message that prompted this action.
	 * @param response  The response from the SDK.
	 * @returns         Promise that resolve to the thread details.
	 */
	private static convertReadConnectionResponse(
		message: TransmitInformation, response: FrontResponse
	): Promise<IdentifyThreadResponse> {
		// Filter the response down to actually matching items
		const idFinder = new RegExp(`\\[${message.source.service} thread ([\\w\\d-+\\/=]+)`);
		const matches = _.filter(
			(response as ConversationComments)._results,
			(comment) => {
				return idFinder.test(comment.body);
			}
		);
		// Let upstream know what we've found.
		if (matches.length > 0) {
			const thread = matches[matches.length - 1].body.match(idFinder);
			if (thread) {
				return Promise.resolve({
					thread: thread[1],
				});
			}
		}
		return Promise.reject(new TranslatorError(
			TranslatorErrorCode.ValueNotFound, 'No connected thread found by querying Front.'
		));
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
	 * @param message    The initial message that prompted this action.
	 * @param _response  The response from the SDK.
	 * @returns          Promise that resolve to the thread details.
	 */
	private static convertCreateThreadResponse(
		session: Front, message: TransmitInformation, _response: FrontResponse
	): Promise<CreateThreadResponse> {
		// The creation of a conversation returns a conversation_reference which is useless.
		// It bears no relation to anything understood by any other part of Front.
		// So we go diving through the recent conversations for a matching subject line.
		return FrontTranslator.findConversation(session, message.details.title)
		.then((conversation: string) => {
			return Promise.resolve({
				thread: conversation,
				url: `https://app.frontapp.com/open/${conversation}`,
			});
		});
	}

	protected eventEquivalencies = {
		message: ['comment', 'out_reply', 'inbound', 'mention'],
	};
	protected emitConverters: EmitConverters = {
		[MessengerAction.ReadConnection]: FrontTranslator.readConnectionIntoEmit,
		[MessengerAction.UpdateTags]: FrontTranslator.updateTagsIntoEmit,
	};
	protected responseConverters: ResponseConverters = {
		[MessengerAction.UpdateTags]: FrontTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateMessage]: FrontTranslator.convertUpdateThreadResponse,
		[MessengerAction.ReadConnection]: FrontTranslator.convertReadConnectionResponse,
	};

	private session: Front;
	private connectionDetails: FrontConstructor;

	constructor(data: FrontConstructor) {
		super();
		this.connectionDetails = data;
		this.session = new Front(data.token);
		this.responseConverters[MessengerAction.CreateThread] =
			_.partial(FrontTranslator.convertCreateThreadResponse, this.session);
		this.emitConverters[MessengerAction.CreateMessage] =
			_.partial(FrontTranslator.createMessageIntoEmit, this.connectionDetails);
		this.emitConverters[MessengerAction.CreateThread] =
			_.partial(FrontTranslator.createThreadIntoEmit, this.connectionDetails);
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to the standard form of the message.
	 */
	public eventIntoMessage(event: ServiceScaffoldEvent): Promise<MessengerEvent> {
		// Gather details of all the inboxes and the complete event.
		return Promise.props({
			inboxes: this.session.conversation.listInboxes({conversation_id: event.rawEvent.conversation.id}),
			event: request({
				headers: {
					authorization: `Bearer ${this.connectionDetails.token}`,
				},
				json: true,
				method: 'GET',
				url: `https://api2.frontapp.com/events/${event.rawEvent.id}`,
			}),
		})
		.then((details: { inboxes: ConversationInboxes, event: any }) => {
			// Extract some details from the event.
			const message = details.event.target.data;
			const metadataFormat = details.event.type === 'comment' ? 'human' : 'logo';
			const metadata = TranslatorScaffold.extractMetadata(message.body, metadataFormat);
			const tags = _.map(details.event.conversation.tags, (tag: {name: string}) => {
				return tag.name;
			});
			const authorDetails = FrontTranslator.extractAuthorDetails(message);
			// Bundle it in service scaffold form and resolve.
			const cookedEvent: BasicMessageInformation = {
				details: {
					genesis: metadata.genesis || event.source,
					handle: authorDetails.username,
					hidden: _.includes(['comment', 'mention'], details.event.type),
					internal: authorDetails.internal,
					tags,
					text: message.text || metadata.content,
					title: details.event.conversation.subject,
				},
				source: {
					service: event.source,
					message: message.id,
					flow: details.inboxes._results[0].id,
					thread: details.event.conversation.id,
					url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
					username: authorDetails.username,
				},
			};
			return {
				context: `${event.source}.${event.cookedEvent.context}`,
				type: this.eventIntoMessageType(event),
				cookedEvent,
				rawEvent: event.rawEvent,
				source: event.source,
			};
		});
	}

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param _message  Message information, not used.
	 * @returns         Promise that resolves to the details required to construct an emitter.
	 */
	public messageIntoEmitterConstructor(_message: TransmitInformation): Promise<FrontConstructor> {
		return Promise.resolve({
			token: this.connectionDetails.token,
			type: ServiceType.Emitter,
		});
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

/**
 * Builds a translator that will convert Front specific information to and from Messenger format.
 * @param data  Construction details for creating a Front session.
 * @returns     A translator, ready to interpret Front's babbling
 */
export function createTranslator(data: FrontConstructor): Translator {
	return new FrontTranslator(data);
}
