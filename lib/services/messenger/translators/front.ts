// /*
//  Copyright 2016-2017 Resin.io
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//  */
//
// import * as Promise from 'bluebird';
// import { Conversation, Front } from 'front-sdk';
// import { RequestData } from 'front-sdk';
// import * as _ from 'lodash';
// import * as request from 'request-promise';
// import { FrontConnectionDetails, FrontEmitContext, FrontEvent, FrontResponse } from '../../front-types';
// import {
// 	MessageContext, MessageEvent, MessageResponseData,
// 	TransmitInformation
// } from '../../messenger-types';
// import { DataHub } from '../datahubs/datahub';
// import * as Translator from './translator';
//
// export class FrontTranslator implements Translator.Translator {
// 	/** Underlying SDK object to query for data */
// 	private session: Front;
// 	private hub: DataHub;
// 	// #200: requests that rely on this to be migrated to Front SDK
// 	private token: string;
// 	private channelPerInbox: {
// 		[inbox: string]: string;
// 	};
//
// 	constructor(data: FrontConnectionDetails, hub: DataHub) {
// 		this.hub = hub;
// 		this.session = new Front(data.token);
// 		this.token = data.token;
// 		this.channelPerInbox = data.channelPerInbox || {};
// 	}
//
// 	public responseIntoMessageResponse(_payload: TransmitInformation, _response: FrontResponse): MessageResponseData {
// 		// TODO: Implement
// 		throw new Error('Method not implemented.');
// 	}
//
// 	public messageIntoConnectionDetails(_message: TransmitInformation): Promise<FrontConnectionDetails> {
// 		return Promise.resolve({
// 			channelPerInbox: this.channelPerInbox,
// 			token: this.token,
// 		});
// 	}
//
// 	/**
// 	 * Translate the provided data, enqueued by the service, into a message context.
// 	 * @param event  Data in the form raw to the service.
// 	 */
// 	public eventIntoMessage(event: FrontEvent): Promise<MessageEvent> {
// 		// TODO: Is this method calling the minimum quantity of API call possible?
// 		// Calculate common request details once
// 		const getGeneric = {
// 			headers: {
// 				authorization: `Bearer ${this.token}`
// 			},
// 			json: true,
// 			method: 'GET',
// 			uri: '', // Will be over-written
// 		};
// 		// Make specific forms of the request object for further details
// 		const getEvent = _.cloneDeep(getGeneric);
// 		getEvent.uri = `https://api2.frontapp.com/events/${event.rawEvent.id}`;
// 		const getInboxes = _.cloneDeep(getGeneric);
// 		getInboxes.uri = `https://api2.frontapp.com/conversations/${event.rawEvent.conversation.id}/inboxes`;
// 		// Gather further details of the enqueued event
// 		return Promise.props({
// 			event: request(getEvent),
// 			inboxes: request(getInboxes),
// 		})
// 		.then((details: { event: any, inboxes: any }) => {
// 			// Pre-calculate a couple of values, to save line width
// 			const message = details.event.target.data;
// 			// TODO: Unnecessary API calls
// 			const metadata = Translator.extractMetadata(message.text || message.body, 'img');
// 			// Attempt to find the author of a message from the various places front might store it
// 			let username = 'Unknown';
// 			if (message.author) {
// 				const author = message.author.username;
// 				const userSubstituted = author.replace('_', '-');
// 				username = /^-/.test(userSubstituted) ? `${userSubstituted.replace(/^-/, '')}-` : userSubstituted;
// 			} else {
// 				for (const recipient of message.recipients) {
// 					if (recipient.role === 'from') {
// 						username = recipient.handle;
// 					}
// 				}
// 			}
// 			// Return the generic form of this event
// 			const cookedEvent: MessageContext = {
// 				details: {
// 					// action: MessageAction.Create,
// 					// first,
// 					genesis: metadata.genesis || event.source,
// 					hidden: details.event.type === 'comment',
// 					// TODO: Something here,
// 					internal: true,
// 					text: metadata.content.trim(),
// 					title: details.event.conversation.subject,
// 				},
// 				source: {
// 					service: event.source,
// 					// TODO: Support multiple inboxes somehow???
// 					flow: details.inboxes._results[0].id,
// 					message: message.id,
// 					thread: details.event.conversation.id,
// 					url: `https://app.frontapp.com/open/${details.event.conversation.id}`,
// 					// TODO: Translate???
// 					username
// 				},
// 			};
// 			return {
// 				context: `${event.source}.${event.cookedEvent.context}`,
// 				// TODO: This to translate
// 				event: 'message',
// 				cookedEvent,
// 				rawEvent: event.rawEvent,
// 				source: 'messenger',
// 			};
// 		});
// 	}
//
// 	public eventIntoMessageEventName(event: FrontEvent): string {
// 		const equivalents: {[key: string]: string} = {
// 			// TODO: Structure this properly
// 			out_reply: 'message',
// 		};
// 		return equivalents[event.event];
// 	}
//
// 	public messageIntoMethodPath(_message: TransmitInformation): Promise<string[]> {
// 		// TODO: This needs to translate
// 		return Promise.resolve([ 'comment', 'create' ]);
// 	}
//
// 	/**
// 	 * Translate the provided message context into an emit context.
// 	 * @param message  Standard form of the message.
// 	 */
// 	public messageIntoEmitComment(message: TransmitInformation): Promise<{method: string[], payload: RequestData}> {
// 		// TODO: This needs to morph the username out of generic format
// 		// Attempt to find the thread ID to know if this is a new conversation or not
// 		const conversationId = message.target.thread;
// 		if (!conversationId) {
// 			// Find the title and user ID for the event
// 			const subject = message.details.title;
// 			if (!subject) {
// 				throw new Error('Cannot create Front Conversation without a title');
// 			}
// 			return this.fetchUserId(message.target.username).then((userId) => {
// 				// The specific form that may be emitted
// 				return { method: ['message', 'send'], payload: {
// 					author_id: userId,
// 					body: `${message.details.text}<hr/><br/>${Translator.stringifyMetadata(message, 'human')}`,
// 					// Find the relevant channel for the inbox
// 					channel_id: this.channelPerInbox[message.target.flow],
// 					metadata: {
// 						thread_ref: message.source.thread,
// 					},
// 					options: {
// 						archive: false,
// 					},
// 					sender: {
// 						handle: message.target.username,
// 					},
// 					subject,
// 					to: [message.source.username],
// 				}};
// 			});
// 		}
// 		return Promise.props({
// 			conversation: this.session.conversation.get({conversation_id: conversationId}),
// 			userId: this.fetchUserId(message.target.username)
// 		}).then((details: { conversation: Conversation, userId: string }) => {
// 			if (message.details.hidden) {
// 				return { method: ['comment', 'create'], payload: {
// 					author_id: details.userId,
// 					body: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message, 'human')}`,
// 					conversation_id: conversationId,
// 				}};
// 			}
// 			return { method: ['message', 'reply'], payload: {
// 				author_id: details.userId,
// 				body: `${message.details.text}<hr/><br/>${Translator.stringifyMetadata(message, 'human')}`,
// 				conversation_id: conversationId,
// 				options: {
// 					archive: false,
// 				},
// 				subject: details.conversation.subject,
// 				type: message.details.hidden ? 'comment' : 'message',
// 			}};
// 		});
// 	}
//
// 	/**
// 	 * Translate the provided message context into an emit context that will retrieve the thread history.
// 	 * @param _message     Standard form of the message.
// 	 * @param _shortlist  *DO NOT RELY ON THIS BEING USED.*  Purely optional optimisation.
// 	 *                    If the endpoint supports it then it may use this to shortlist the responses.
// 	 */
// 	public messageIntoEmitReadThread(_message: MessageContext, _shortlist?: RegExp): Promise<FrontEmitContext> {
// 		// TODO; Implementr
// 		throw new Error('nyi');
// 		// return Promise.resolve({
// 		// 	action: 'listComments',
// 		// 	objectType: 'conversation',
// 		// 	data: {
// 		// 		conversation_id: message.source.thread,
// 		// 	},
// 		// });
// 	}
//
// 	/**
// 	 * Translate the provided generic name for an event into the service events to listen to.
// 	 * @param name  Generic name for an event.
// 	 */
// 	public eventNameIntoTriggers(name: string): string[] {
// 		const equivalents: {[key: string]: string[]} = {
// 			message: ['out_reply'],
// 		};
// 		return equivalents[name];
// 	}
//
// 	/**
// 	 * Returns an array of all the service events that may be translated.
// 	 */
// 	public getAllTriggers(): string[] {
// 		return ['out_reply'];
// 	}
//
// 	/**
// 	 * Find the ID of a user specified by username.
// 	 * @param username  Target username to search for.
// 	 * @returns         Promise that resolves to the user id.
// 	 */
// 	private fetchUserId = (username: string): Promise<string|undefined> => {
// 		// Request a list of all teammates
// 		const getTeammates = {
// 			headers: {
// 				authorization: `Bearer ${this.token}`
// 			},
// 			json: true,
// 			method: 'GET',
// 			uri: 'https://api2.frontapp.com/teammates',
// 		};
// 		return request(getTeammates).then((teammates: {_results: Array<{username: string, id: string}>}) => {
// 			// Resolve to the ID of the first matching teammate
// 			const teammate = _.find(teammates._results, (eachTeammate) => {
// 				return eachTeammate.username === username;
// 			});
// 			if (teammate) {
// 				return teammate.id;
// 			}
// 		});
// 	}
// }
//
// export function createTranslator(data: FrontConnectionDetails, hub: DataHub): Translator.Translator {
// 	return new FrontTranslator(data, hub);
// }
