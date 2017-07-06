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
import * as path from 'path';
import * as request from 'request-promise';
import { FrontConstructor, FrontEmitContext, FrontHandle } from './front-types';
import { ServiceUtilities } from './service-utilities';
import { MessengerAction, MessengerEmitResponse, ReceiptContext, TransmitContext } from './messenger-types';
import { ServiceEmitter, ServiceEvent, ServiceListener } from './service-types';

export class FrontService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
	private static _serviceName = path.basename(__filename.split('.')[0]);
	private session: Front;

	public constructor(token: string, listen = true) {
		super(listen);
		this.session = new Front(token);
	}

	/**
	 * Promise to find the comment history of a particular thread.
	 * @param thread  id of the thread to search.
	 * @param _room   id of the room in which the thread resides.
	 * @param filter  Criteria to match.
	 */
	public fetchNotes = (thread: string, _room: string, filter: RegExp): Promise<string[]> => {
		return this.session.conversation.listComments({conversation_id: thread})
		.then((comments) => {
			return _.filter(comments._results, (value) => {
				return filter.test(value.body);
			}).map((value) => {
				return value.body;
			});
		});
	}

	/**
	 * Promise to turn the data enqueued into a generic message format.
	 * @param data  Raw data from the enqueue, remembering this is as dumb and quick as possible.
	 * @returns     A promise that resolves to the generic form of the event.
	 */
	public makeGeneric = (data: ServiceEvent): Promise<ReceiptContext> => {
		// Calculate common request details once
		const getGeneric = {
			headers: {
				authorization: `Bearer ${this.data.token}`
			},
			json: true,
			method: 'GET',
			uri: '', // Will be over-written
		};
		// Make specific forms of the request object for further details
		const getEvent = _.cloneDeep(getGeneric);
		getEvent.uri = `https://api2.frontapp.com/events/${data.rawEvent.id}`;
		const getInboxes = _.cloneDeep(getGeneric);
		getInboxes.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/inboxes`;
		const getMessages = _.cloneDeep(getGeneric);
		getMessages.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/messages`;
		const getComments = _.cloneDeep(getGeneric);
		getComments.uri = `https://api2.frontapp.com/conversations/${data.rawEvent.conversation.id}/comments`;
		// Gather further details of the enqueued event
		return Promise.props({
			comments: request(getComments),
			event: request(getEvent),
			inboxes: request(getInboxes),
			messages: request(getMessages),
		})
		.then((details: {comments: any, event: any, inboxes: any, messages: any}) => {
			// Pre-calculate a couple of values, to save line width
			const message = details.event.target.data;
			const first = details.comments._results.length + details.messages._results.length === 1;
			const metadata = Messenger.extractMetadata(message.text || message.body);
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
				action: MessengerAction.Create,
				first,
				genesis: metadata.genesis || data.source || FrontService._serviceName,
				hidden: first ? metadata.hidden : details.event.type === 'comment',
				source: FrontService._serviceName,
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
	 * Promise to turn the generic message format into a specific form to be emitted.
	 * @param data  Generic message format object to be encoded.
	 * @returns     Promise that resolves to the emit suitable form.
	 */
	public makeSpecific = (data: TransmitContext): Promise<FrontEmitContext> => {
		// Attempt to find the thread ID to know if this is a new conversation or not
		const conversationId = data.toIds.thread;
		if (!conversationId) {
			// Find the title and user ID for the event
			const subject = data.title;
			if (!subject) {
				throw new Error('Cannot create Front Conversation without a title');
			}
			return this.fetchUserId(data.toIds.user).then((userId) => {
				// The specific form that may be emitted
				return {
					endpoint: {
						method: this.apiHandle.front.message.send,
					},
					payload: {
						author_id: userId,
						body: `${data.text}<hr/><br/>${Messenger.stringifyMetadata(data, 'plaintext')}`,
						// Find the relevant channel for the inbox
						channel_id: this.data.inbox_channels[data.toIds.flow],
						metadata: {
							thread_ref: data.sourceIds.thread,
						},
						options: {
							archive: false,
						},
						sender: {
							handle: data.toIds.user,
						},
						subject,
						to: [data.sourceIds.user],
					}
				};
			});
		}
		return Promise.props({
			conversation: this.session.conversation.get({conversation_id: conversationId}),
			userId: this.fetchUserId(data.toIds.user)
		}).then((details: {conversation: Conversation, userId: string}) => {
			if (data.hidden) {
				return {
					endpoint: {
						method: this.apiHandle.front.comment.create,
					},
					payload: {
						author_id: details.userId,
						body: `${data.text}\n\n---\n${Messenger.stringifyMetadata(data, 'plaintext')}`,
						conversation_id: conversationId,
					}
				};
			}
			return {
				endpoint: {
					method: this.apiHandle.front.message.reply,
				},
				payload: {
					author_id: details.userId,
					body: `${data.text}<hr/><br/>${Messenger.stringifyMetadata(data, 'plaintext')}`,
					conversation_id: conversationId,
					options: {
						archive: false,
					},
					subject: details.conversation.subject,
					type: data.hidden ? 'comment' : 'message',
				}
			};
		});
	}

	/**
	 * Activate this service as a listener.
	 */
	protected activateListener = (): void => {
		// This swallows webhook events.  When operating on an entire inbox we use its webhook rule, but a webhook
		// channel still requires somewhere to send its webhooks to.
		AOLCommon.expressApp.post('/front-dev-null', (_formData, response) => {
			response.sendStatus(200);
		});
		// Create an endpoint for this listener and enqueue events
		AOLCommon.expressApp.post(`/${FrontService._serviceName}/`, (formData, response) => {
			this.queueEvent({
				data: {
					cookedEvent: {
						context: formData.body.conversation.id,
						type: 'something' // TODO
					},
					rawEvent: formData.body,
					source: FrontService._serviceName,
				},
				workerMethod: this.handleEvent,
			});
			response.sendStatus(200);
		});
	}

	/**
	 * Deliver the payload to the service. Sourcing the relevant context has already been performed.
	 * @param data  The object to be delivered to the service.
	 * @returns     Response from the service endpoint.
	 */
	protected sendPayload = (data: FrontEmitContext): Promise<MessengerEmitResponse> => {
		return data.endpoint.method(data.payload).then(() => {
			if(data.payload.conversation_id) {
				return Promise.resolve({
					response: {
						message: `${data.payload.author_id}:${new Date().getTime()}`,
						thread: data.payload.conversation_id,
						url: `https://app.frontapp.com/open/${data.payload.conversation_id}`,
					},
					source: FrontService._serviceName,
				});
			}
			return this.findConversation(data.payload.subject)
			.then((conversationId) => {
				return {
					response: {
						message: `${data.payload.author_id}:${new Date().getTime()}`,
						thread: conversationId,
						url: `https://app.frontapp.com/open/${conversationId}`,
					},
					source: FrontService._serviceName,
				};
			});
		});
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
				authorization: `Bearer ${this.data.token}`
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

	/**
	 * Attempt to find a recent conversation ID from it's subject line.
	 * Done by subject because the conversation_reference provided is sometimes junk.
	 * @param subject       Target subject line to search for.
	 * @param attemptsLeft  Since conversations take time to propagate this method may recurse.
	 * @returns             Promise that resolves to the ID of the conversation.
	 */
	private findConversation = (subject: string, attemptsLeft: number = 10): Promise<string> => {
		// Find all the recent conversations
		return this.session.conversation.list().then((response) => {
			// Filter these down to matching conversations
			const conversationsMatched = _.filter(response._results, (conversation) => {
				return conversation.subject === subject;
			});
			// Return the most recent, if any
			if (conversationsMatched.length > 0) {
				return conversationsMatched[0].id;
			}
			// Recurse up to the specified number of times
			if (attemptsLeft > 1) {
				return this.findConversation(subject, attemptsLeft - 1);
			}
			throw new Error('Could not find relevant conversation.');
		});
	}

	/**
	 * The name of this service, as required by the framework.
	 * @returns  'flowdock' string.
	 */
	get serviceName(): string {
		return FrontService._serviceName;
	}

	/**
	 * Retrieve the SDK API handle for Front.
	 * @return  The Front SDK API handle.
	 */
	get apiHandle(): FrontHandle {
		return {
			front: this.session
		};
	}
}

/**
 * Build this class, typed and activated as a listener.
 * @returns  Service Listener object, awakened and ready to go.
 */
export function createServiceListener(data: FrontConstructor): ServiceListener {
	return new FrontService(data.token, true);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: FrontConstructor): ServiceEmitter {
	return new FrontService(data.token, false);
}
