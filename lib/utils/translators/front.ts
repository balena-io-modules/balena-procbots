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
import { Front } from 'front-sdk';
import { FrontConnectionDetails, FrontEmitContext, FrontEvent } from '../../services/front-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import { Translator } from './translator';

// TODO: Implement
export class FrontTranslator extends Translator {
	/** Underlying SDK object to query for data */
	private session: Front;

	constructor(data: FrontConnectionDetails) {
		super();
		this.session = new Front(data.token);
	}

	/**
	 * Translate the provided data, enqueued by the service, into a message context
	 * @param _data  Data in the form raw to the service
	 */
	public eventIntoMessage(_data: FrontEvent): Promise<MessageContext> {
		throw new Error('Method not implemented.');
	}

	/**
	 * Translate the provided message context into an emit context
	 * @param _message  Standard form of the message
	 */
	public messageIntoEmit(_message: TransmitContext): Promise<FrontEmitContext> {
		throw new Error('Method not implemented.');
	}

	/**
	 * Translate the provided generic name for an event into the service events to listen to
	 * @param _eventName  Generic name for an event
	 */
	public eventNameIntoTriggers(_eventName: string): string[] {
		throw new Error('Method not implemented.');
	}

	// /**
	//  * Promise to turn the data enqueued into a generic message format.
	//  * @param data  Raw data from the enqueue, remembering this is as dumb and quick as possible.
	//  * @returns     A promise that resolves to the generic form of the event.
	//  */
	// public makeGeneric = (data: ServiceEvent): Promise<ReceiptContext> => {
	// 	// Calculate common request details once
	// 	const getGeneric = {
	// 		headers: {
	// 			authorization: `Bearer ${this.data.token}`
	// 		},
	// 		json: true,
	// 		method: 'GET',
	// 		uri: '', // Will be over-written
	// 	};
	// 	// Make specific forms of the request object for further details
	// 	const getEvent = _.cloneDeep(getGeneric);
	// 	getEvent.uri = `https://api2.frontapp.com/events/${data.rawEvent.id}`;
	// 	const getInboxes = _.cloneDeep(getGeneric);
	// 	getInboxes.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/inboxes`;
	// 	const getMessages = _.cloneDeep(getGeneric);
	// 	getMessages.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/messages`;
	// 	const getComments = _.cloneDeep(getGeneric);
	// 	getComments.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/comments`;
	// 	// Gather further details of the enqueued event
	// 	return Promise.props({
	// 		comments: request(getComments),
	// 		event: request(getEvent),
	// 		inboxes: request(getInboxes),
	// 		messages: request(getMessages),
	// 	})
	// 		.then((details: { comments: any, event: any, inboxes: any, messages: any }) => {
	// 			// Pre-calculate a couple of values, to save line width
	// 			const message = details.event.target.data;
	// 			const first = details.comments._results.length + details.messages._results.length === 1;
	// 			const metadata = Messenger.extractMetadata(message.text || message.body);
	// 			// Attempt to find the author of a message from the various places front might store it
	// 			let author = 'Unknown';
	// 			if (message.author) {
	// 				author = message.author.username;
	// 			} else {
	// 				for (const recipient of message.recipients) {
	// 					if (recipient.role === 'from') {
	// 						author = recipient.handle;
	// 					}
	// 				}
	// 			}
	// 			// Return the generic form of this event
	// 			return {
	// 				action: MessageAction.Create,
	// 				first,
	// 				genesis: metadata.genesis || data.source || FrontService._serviceName,
	// 				hidden: first ? metadata.hidden : details.event.type === 'comment',
	// 				source: FrontService._serviceName,
	// 				sourceIds: {
	// 					flow: details.inboxes._results[0].id,
	// 					message: message.id,
	// 					thread: details.event.conversation.id,
	// 					url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
	// 					user: author,
	// 				},
	// 				text: metadata.content,
	// 				title: details.event.conversation.subject,
	// 			};
	// 		});
	// }
	//
	// /**
	//  * Promise to turn the generic message format into a specific form to be emitted.
	//  * @param data  Generic message format object to be encoded.
	//  * @returns     Promise that resolves to the emit suitable form.
	//  */
	// public makeSpecific = (data: TransmitContext): Promise<FrontEmitContext> => {
	// 	// Attempt to find the thread ID to know if this is a new conversation or not
	// 	const conversationId = data.toIds.thread;
	// 	if (!conversationId) {
	// 		// Find the title and user ID for the event
	// 		const subject = data.title;
	// 		if (!subject) {
	// 			throw new Error('Cannot create Front Conversation without a title');
	// 		}
	// 		return this.fetchUserId(data.toIds.user).then((userId) => {
	// 			// The specific form that may be emitted
	// 			return {
	// 				endpoint: {
	// 					method: this.apiHandle.front.message.send,
	// 				},
	// 				payload: {
	// 					author_id: userId,
	// 					body: `${data.text}<hr/><br/>${Messenger.stringifyMetadata(data, 'plaintext')}`,
	// 					// Find the relevant channel for the inbox
	// 					channel_id: this.data.inbox_channels[data.toIds.flow],
	// 					metadata: {
	// 						thread_ref: data.sourceIds.thread,
	// 					},
	// 					options: {
	// 						archive: false,
	// 					},
	// 					sender: {
	// 						handle: data.toIds.user,
	// 					},
	// 					subject,
	// 					to: [data.sourceIds.user],
	// 				}
	// 			};
	// 		});
	// 	}
	// 	return Promise.props({
	// 		conversation: this.session.conversation.get({conversation_id: conversationId}),
	// 		userId: this.fetchUserId(data.toIds.user)
	// 	}).then((details: { conversation: Conversation, userId: string }) => {
	// 		if (data.hidden) {
	// 			return {
	// 				endpoint: {
	// 					method: this.apiHandle.front.comment.create,
	// 				},
	// 				payload: {
	// 					author_id: details.userId,
	// 					body: `${data.text}\n\n---\n${Messenger.stringifyMetadata(data, 'plaintext')}`,
	// 					conversation_id: conversationId,
	// 				}
	// 			};
	// 		}
	// 		return {
	// 			endpoint: {
	// 				method: this.apiHandle.front.message.reply,
	// 			},
	// 			payload: {
	// 				author_id: details.userId,
	// 				body: `${data.text}<hr/><br/>${Messenger.stringifyMetadata(data, 'plaintext')}`,
	// 				conversation_id: conversationId,
	// 				options: {
	// 					archive: false,
	// 				},
	// 				subject: details.conversation.subject,
	// 				type: data.hidden ? 'comment' : 'message',
	// 			}
	// 		};
	// 	});
	// }
}

export function createTranslator(data: FrontConnectionDetails): Translator {
	return new FrontTranslator(data);
}
