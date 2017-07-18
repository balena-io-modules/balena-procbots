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
import { Conversation, Front } from 'front-sdk';
import * as _ from 'lodash';
import * as request from 'request-promise';
import { FrontConnectionDetails, FrontEmitContext, FrontEvent } from '../../services/front-types';
import { MessageAction, MessageContext, TransmitContext } from '../../services/messenger-types';
import * as Translator from './translator';

export class FrontTranslator implements Translator.Translator {
	/** Underlying SDK object to query for data */
	private session: Front;
	// #200: requests that rely on this to be migrated to Front SDK
	private token: string;
	private channelPerInbox: {
		[inbox: string]: string;
	};

	constructor(data: FrontConnectionDetails) {
		this.session = new Front(data.token);
		this.token = data.token;
		this.channelPerInbox = data.channelPerInbox || {};
	}

	/**
	 * Translate the provided data, enqueued by the service, into a message context
	 * @param event  Data in the form raw to the service
	 */
	public eventIntoCreateMessage(event: FrontEvent): Promise<MessageContext> {
		// Calculate common request details once
		const getGeneric = {
			headers: {
				authorization: `Bearer ${this.token}`
			},
			json: true,
			method: 'GET',
			uri: '', // Will be over-written
		};
		// Make specific forms of the request object for further details
		const getEvent = _.cloneDeep(getGeneric);
		getEvent.uri = `https://api2.frontapp.com/events/${event.rawEvent.id}`;
		const getInboxes = _.cloneDeep(getGeneric);
		getInboxes.uri = `https://api2.frontapp.com/conversations/${event.rawEvent.conversation.id}/inboxes`;
		const getMessages = _.cloneDeep(getGeneric);
		getMessages.uri = `https://api2.frontapp.com/conversations/${event.rawEvent.conversation.id}/messages`;
		const getComments = _.cloneDeep(getGeneric);
		getComments.uri = `https://api2.frontapp.com/conversations/${event.rawEvent.conversation.id}/comments`;
		// Gather further details of the enqueued event
		return Promise.props({
			comments: request(getComments),
			event: request(getEvent),
			inboxes: request(getInboxes),
			messages: request(getMessages),
		})
		.then((details: { comments: any, event: any, inboxes: any, messages: any }) => {
			// Pre-calculate a couple of values, to save line width
			const message = details.event.target.data;
			const first = details.comments._results.length + details.messages._results.length === 1;
			const metadata = Translator.extractMetadata(message.text || message.body);
			// Attempt to find the author of a message from the various places front might store it
			let author = 'Unknown';
			if (message.author) {
				author = message.author.username;
			} else {
				for (const recipient of message.recipients) {
					if (recipient.role === 'from') {
						author = recipient.handle;
					}
				}
			}
			// Return the generic form of this event
			return {
				action: MessageAction.Create,
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
		});
	}

	/**
	 * Translate the provided message context into an emit context
	 * @param message  Standard form of the message
	 */
	public messageIntoEmit(message: TransmitContext): Promise<FrontEmitContext> {
		// Attempt to find the thread ID to know if this is a new conversation or not
		const conversationId = message.toIds.thread;
		if (!conversationId) {
			// Find the title and user ID for the event
			const subject = message.title;
			if (!subject) {
				throw new Error('Cannot create Front Conversation without a title');
			}
			return this.fetchUserId(message.toIds.user).then((userId) => {
				// The specific form that may be emitted
				return {
					action: 'send',
					objectType: 'message',
					payload: {
						author_id: userId,
						body: `${message.text}<hr/><br/>${Translator.stringifyMetadata(message, 'plaintext')}`,
						// Find the relevant channel for the inbox
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
			conversation: this.session.conversation.get({conversation_id: conversationId}),
			userId: this.fetchUserId(message.toIds.user)
		}).then((details: { conversation: Conversation, userId: string }) => {
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

	/**
	 * Translate the provided generic name for an event into the service events to listen to
	 * @param name  Generic name for an event
	 */
	public eventNameIntoTriggers(name: string): string[] {
		const equivalents: {[key: string]: string[]} = {
			message: ['event'],
		};
		return equivalents[name];
	}

	/**
	 * Find the ID of a user specified by username.
	 * @param username  Target username to search for.
	 * @returns         Promise that resolves to the user id.
	 */
	private fetchUserId = (username: string): Promise<string|undefined> => {
		// Request a list of all teammates
		const getTeammates = {
			headers: {
				authorization: `Bearer ${this.token}`
			},
			json: true,
			method: 'GET',
			uri: 'https://api2.frontapp.com/teammates',
		};
		return request(getTeammates).then((teammates: {_results: Array<{username: string, id: string}>}) => {
			// Resolve to the ID of the first matching teammate
			const teammate = _.find(teammates._results, (eachTeammate) => {
				return eachTeammate.username === username;
			});
			if (teammate) {
				return teammate.id;
			}
		});
	}
}

export function createTranslator(data: FrontConnectionDetails): Translator.Translator {
	return new FrontTranslator(data);
}