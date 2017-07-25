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
import { Session } from 'flowdock';
import * as _ from 'lodash';
import * as path from 'path';
import * as request from 'request-promise';
import { FlowdockConstructor, FlowdockEmitContext, FlowdockHandle, FlowdockMessage } from './flowdock-types';
import { Messenger } from './messenger';
import {
	DataHub, MessengerAction, MessengerEmitResponse, MessengerEvent, ReceiptContext, TransmitContext
} from './messenger-types';
import { ServiceEmitter, ServiceListener } from './service-types';

export class FlowdockService extends Messenger implements ServiceEmitter, ServiceListener, DataHub {
	private static _serviceName = path.basename(__filename.split('.')[0]);
	// There are circumstances in which one flowdock event will be received more than once, so track.
	private receivedPostIds = new Set<number>();
	private session: Session;
	private data: FlowdockConstructor;

	public constructor(data: FlowdockConstructor, listen = true ) {
		super(listen);
		this.data = data;
		this.session = new Session(data.token);
	}

	/**
	 * Promise to turn the data enqueued into a generic message format.
	 * @param data  Raw data from the enqueue, remembering this is as dumb and quick as possible.
	 * @returns     A promise that resolves to the generic form of the event.
	 */
	public makeGeneric = (data: MessengerEvent): Promise<ReceiptContext> => {
		const org = this.data.organization;
		const flow = data.cookedEvent.flow;
		const initialMessageID = data.rawEvent.thread.initial_message;
		const tagFilter = (tag: string) => {
			return !/^:/.test(tag);
		};
		return this.fetchFromSession(`/flows/${org}/${flow}/messages/${initialMessageID}`)
		.then((initialMessage) => {
			// If the data added any hashtags then update the initial message
			if (data.rawEvent.tags.filter(tagFilter).length > 0) {
				return this.sendPayload({
					endpoint: {
						method: 'PUT',
						token: this.data.token,
						url: `https://api.flowdock.com/flows/${org}/${flow}/messages/${initialMessageID}`
					},
					payload: {
						tags: _.concat(data.rawEvent.tags, initialMessage.tags).filter(tagFilter),
					},
				}).then(() => {
					return initialMessage;
				});
			}
			return initialMessage;
		})
		.then((initialMessage) => {
			// Imported messages use emoji and have a genesis, but native messages use char
			const emojiMetadata = Messenger.extractMetadata(data.rawEvent.content, 'emoji');
			const charMetadata = Messenger.extractMetadata(data.rawEvent.content, 'char');
			const compiledMetadata = {
				genesis: emojiMetadata.genesis || charMetadata.genesis || data.source,
				hidden: emojiMetadata.hidden && charMetadata.hidden,
				content: emojiMetadata.genesis ? emojiMetadata.content : charMetadata.content,
			};
			// Separate out some parts of the message to save line width and calculations later
			const titleAndText = compiledMetadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
			const thread = data.rawEvent.thread_id;
			const userId = data.rawEvent.user;
			const first = data.rawEvent.id === data.rawEvent.thread.initial_message;
			const returnValue = {
				action: MessengerAction.Create,
				first,
				genesis: compiledMetadata.genesis,
				hidden: compiledMetadata.hidden,
				source: data.source,
				sourceIds: {
					message: data.rawEvent.id,
					flow,
					thread,
					url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
					user: 'duff', // gets replaced
				},
				tags: _.concat(data.rawEvent.tags, initialMessage.tags).filter(tagFilter),
				text: first && titleAndText ? titleAndText[2] : compiledMetadata.content,
				title: first && titleAndText ? titleAndText[1] : undefined,
			};
			// If the data provided a username
			if (data.rawEvent.external_user_name) {
				returnValue.sourceIds.user = data.rawEvent.external_user_name;
				return returnValue;
			}
			return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
			.then((user) => {
				returnValue.sourceIds.user = user.nick;
				return returnValue;
			});
		});
	}

	/**
	 * Promise to turn the generic message format into a specific form to be emitted.
	 * @param data  Generic message format object to be encoded.
	 * @returns     Promise that resolves to the emit suitable form.
	 */
	public makeSpecific = (data: TransmitContext): Promise<FlowdockEmitContext> => {
		// Calculate details such as title, footer and snipped message, if appropriate.
		const lengthLimit = 8096;
		const titleText = data.toIds.thread ? '' : data.title + '\n--\n';
		const footerText = Messenger.stringifyMetadata(data, 'emoji');
		let trimText = '\n\n`... about xx% shown.`';
		const trimmedText = data.text.substr(0, lengthLimit - titleText.length - trimText.length - footerText.length);
		trimText = trimText.replace('xx', Math.floor((100*trimmedText.length)/data.text.length).toString(10));
		const bodyText = (titleText.length + data.text.length + footerText.length) < lengthLimit
			? data.text
			: trimmedText + trimText;
		const org = this.data.organization;
		const flow = data.toIds.flow;
		return new Promise<FlowdockEmitContext>((resolve) => {
			resolve({
				endpoint: {
					method: 'POST',
					token: data.toIds.token,
					url: `https://api.flowdock.com/flows/${org}/${flow}/messages/`,
				},
				meta: {
					flow,
					org,
				},
				payload: {
					// The concatenated string, of various data nuggets, to emit
					content: `${titleText}${bodyText}${footerText}`,
					event: 'message',
					external_user_name:
					// If this is using the generic token, then they must be an external user, so indicate this
						data.toIds.token === this.data.token ? data.toIds.user.substring(0, 16) : undefined,
					tags: data.first ? data.tags : undefined,
					thread_id: data.toIds.thread,
				},
			});
		});
	}

	// This was created on an out-of-date understanding of how things should be structured.
	// TODO: It should be migrated as part of https://github.com/resin-io-modules/resin-procbots/issues/173
	/**
	 * Promise to turn the generic message format into a tag update to be emitted.
	 * @param data  Generic message format object to be encoded.
	 * @returns     Promise that resolves to the tag update object.
	 */
	public makeTagUpdate = (data: TransmitContext): Promise<FlowdockEmitContext> => {
		const topicId = data.toIds.thread;
		if (!topicId) {
			throw new Error('Cannot update tags without specifying thread');
		}
		const org = this.data.organization;
		const flow = data.toIds.flow;
		return this.fetchFromSession(`/flows/${org}/${flow}/threads/${topicId}`).then((threadObj) => {
			return {
				endpoint: {
					method: 'PUT',
					token: data.toIds.token,
					url: `https://api.flowdock.com/flows/${org}/${flow}/messages/${threadObj.initial_message}`,
				},
				payload: {
					tags: data.tags ? data.tags : [],
				},
			};
		});
	}

	/**
	 * Turns the generic, messenger, name for an event into a specific trigger name for this class.
	 * @param eventType  Name of the event to translate, eg 'message'.
	 * @returns          This class's equivalent, eg 'post'.
	 */
	public translateEventName(eventType: string): string {
		const equivalents: {[key: string]: string} = {
			message: 'message',
		};
		return equivalents[eventType];
	}

	/**
	 * Promise to find the comment history of a particular thread.
	 * @param thread  id of the thread to search.
	 * @param room    id of the room in which the thread resides.
	 * @param filter  Criteria to match.
	 * @param search  Optional, some words which may be used to shortlist the results.
	 */
	public fetchNotes = (thread: string, room: string, filter: RegExp, search?: string): Promise<string[]> => {
		// Query the API
		const org = this.data.organization;
		return this.fetchFromSession(`/flows/${org}/${room}/threads/${thread}/messages`, search)
		.then((messages) => {
			return _.map(messages, (value: FlowdockMessage) => {
				// Clean the response to just the content
				return value.content;
			}).filter((value: string) => {
				// Filter the response to just matches
				const match = value.match(filter);
				return (match !== null) && (match.length > 0);
			});
		});
	}

	/**
	 * Search for the specified value associated with a user.
	 * @param user  Username to search associated with.
	 * @param key   Name of the value to retrieve.
	 * @returns     Promise that resolves to the value.
	 */
	public fetchValue(user: string, key: string): Promise<string> {
		// Retrieve a particular regex from the 1-1 message history of the user
		const findKey = new RegExp(`My ${key} is (\\S+)`, 'i');
		return this.fetchPrivateMessages(user, findKey).then((valueArray) => {
			const value = valueArray[valueArray.length - 1].match(findKey);
			if (value) {
				return value[1];
			}
			throw new Error(`Could not find value $key for $user`);
		});
	}

	/**
	 * Activate this service as a listener.
	 */
	protected activateMessageListener = (): void => {
		// Get a list of known flows from the session
		this.session.flows((error: any, flows: any) => {
			if (error) {
				throw error;
			}
			// Store the names and stream retrieved flows
			const flowIdToFlowName: {[key: string]: string} = {};
			for (const flow of flows) {
				flowIdToFlowName[flow.id] = flow.parameterized_name;
			}
			const stream = this.session.stream(Object.keys(flowIdToFlowName));
			// Listen to messages and check they are messages
			stream.on('message', (message: any) => {
				if (message.event === 'message' && !this.receivedPostIds.has(message.id)) {
					this.receivedPostIds.add(message.id);
					// Enqueue new message events
					this.queueEvent({
						data: {
							cookedEvent: {
								context: message.thread_id,
								flow: flowIdToFlowName[message.flow],
								type: message.event,
							},
							rawEvent: message,
							source: FlowdockService._serviceName,
						},
						workerMethod: this.handleEvent,
					});
				}
			});
		});
		// Create a keep-alive endpoint for contexts that sleep between web requests
		Messenger.expressApp.get(`/${FlowdockService._serviceName}/`, (_formData, response) => {
			response.sendStatus(200);
		});
	}

	/**
	 * Deliver the payload to the service. Sourcing the relevant context has already been performed.
	 * @param data  The object to be delivered to the service.
	 * @returns     Response from the service endpoint.
	 */
	protected sendPayload = (data: FlowdockEmitContext): Promise<MessengerEmitResponse> => {
		// Extract a couple of details from the environment
		const token = new Buffer(data.endpoint.token).toString('base64');
		// Post to the API
		const requestOpts = {
			body: data.payload,
			headers: {
				Authorization: `Basic ${token}`,
				'X-flowdock-wait-for-message': true,
			},
			json: true,
			method: data.endpoint.method,
			url: data.endpoint.url,
		};
		return request(requestOpts).then((resData: any) => {
			// Massage the response into a suitable form for the framework
			const thread = resData.thread_id;
			const org = data.meta ? data.meta.org : '';
			const flow = data.meta ? data.meta.flow : '';
			const url = data.meta ? `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}` : undefined;
			return {
				response: {
					message: resData.id,
					thread: resData.thread_id,
					url,
				},
				source: FlowdockService._serviceName,
			};
		});
	}

	/**
	 * Search for recent private messages with our account that match on username and regex.
	 * @param username  Scope of the private messages to search.
	 * @param filter    Narrow our search to just matches.
	 * @returns         Promise that resolves to the message strings.
	 */
	private fetchPrivateMessages(username: string, filter: RegExp): Promise<string[]> {
		// Fetch the id then 1-1 history associated with the username
		return this.fetchUserId(username)
		.then((userId) => {
			return this.fetchFromSession(`/private/${userId}/messages`)
			.then((fetchedMessages) => {
				// Prune and clean the message history to text of interest
				return _.filter(fetchedMessages, (message: FlowdockMessage) => {
					return filter.test(message.content);
				}).map((message: FlowdockMessage) => {
					return message.content;
				});
			});
		});
	}

	/**
	 * Fetch a user's id from their username.
	 * @param username  Username to search for.
	 * @returns         id of the user.
	 */
	private fetchUserId = (username: string): Promise<string | undefined> => {
		// Get all the users of the service
		return this.fetchFromSession(`/organizations/${this.data.organization}/users`)
		.then((foundUsers) => {
			// Generate an array of user objects with matching username
			const matchingUsers = _.filter(foundUsers, (eachUser: any) => {
				return eachUser.nick.toLowerCase() === username.toLowerCase();
			});
			// Return id if we've exactly one user for a particular username
			if (matchingUsers.length === 1) {
				return(matchingUsers[0].id);
			}
		});
	}

	/**
	 * Utility function to structure the flowdock session as a promise a little.
	 * @param path    Endpoint to retrieve.
	 * @param search  Optional, some words which may be used to shortlist the results.
	 * @returns       Response from the session.
	 */
	private fetchFromSession = (path: string, search?: string): Promise<any> => {
		return new Promise<any>((resolve, reject) => {
			// The flowdock service both emits and calls back the error.
			// We're wrapping the emit in a promise reject and ignoring the call back
			this.session.on('error', reject);
			this.session.get(path, {search}, (_error?: Error, result?: any) => {
				this.session.removeListener('error', reject);
				if (result) {
					resolve(result);
				}
			});
		});
	}

	/**
	 * Get the service name, as required by the framework.
	 * @returns  The specific service name for Flowdock.
	 */
	get serviceName(): string {
		return FlowdockService._serviceName;
	}

	/**
	 * Retrieve the SDK API handle for Flowdock.
	 * @returns  The Flowdock SDK API handle.
	 */
	get apiHandle(): FlowdockHandle {
		return {
			flowdock: this.session
		};
	}
}

/**
 * Build this class, typed and activated as a listener.
 * @returns  Service Listener object, awakened and ready to go.
 */
export function createServiceListener(data: FlowdockConstructor): ServiceListener {
	return new FlowdockService(data, true);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: FlowdockConstructor): ServiceEmitter {
	return new FlowdockService(data, false);
}

/**
 * Build this class, typed as a message service.
 * @returns  Message Service object, ready to convert events.
 */
export function createMessageService(data: FlowdockConstructor): Messenger {
	return new FlowdockService(data, false);
}

/**
 * Build this class, typed as a data hub.
 * @returns  Data Hub object, ready to retrieve user data.
 */
export function createDataHub(data: FlowdockConstructor): DataHub {
	return new FlowdockService(data, false);
}
