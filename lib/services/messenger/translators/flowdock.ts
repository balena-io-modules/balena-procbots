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
import { ProcBotError } from '../../../framework/procbot';
import { ProcBotErrorCode } from '../../../framework/procbot-types';
import { FlowdockConnectionDetails, FlowdockEmitData, FlowdockEvent, FlowdockResponse } from '../../flowdock-types';
import {
	MessageAction, MessageEvent, MessageInformation,
	MessageResponseData, TransmitInformation,
} from '../../messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';

export class FlowdockTranslator implements Translator.Translator {
	private hubs: DataHub[];
	private session: Session;
	private organization: string;
	private eventEquivalencies: {[generic: string]: string[]} = {
		message: ['message'],
	};

	constructor(data: FlowdockConnectionDetails, hubs: DataHub[]) {
		this.hubs = hubs;
		this.session = new Session(data.token);
		const doNothing = () => { /* pass */ };
		// The flowdock service both emits and calls back the error
		// We'll specifically ignore the emit to prevent it bubbling
		this.session.on('error', doNothing);
		this.organization = data.organization;
	}

	public eventIntoMessageType(event: MessageEvent): string {
		return _.findKey(this.eventEquivalencies, (value: string[]) => {
			return _.includes(value, event.type);
		}) || 'Misc event';
	}

	public messageTypeIntoEventTypes(type: string): string[] {
		return this.eventEquivalencies[type];
	}

	public getAllEventTypes(): string[] {
		return _.flatMap(this.eventEquivalencies, _.identity);
	}

	public eventIntoMessage(event: FlowdockEvent): Promise<MessageEvent> {
		// Separate out some parts of the message
		const metadata = Translator.extractMetadata(event.rawEvent.content, 'emoji');
		const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
		const flow = event.cookedEvent.flow;
		const thread = event.rawEvent.thread_id;
		const userId = event.rawEvent.user;
		const org = this.organization;
		const cookedEvent: MessageInformation = {
			// action: MessageAction.Create,
			// first: event.rawEvent.id === event.rawEvent.thread.initial_message,
			details: {
				genesis: metadata.genesis || event.source,
				hidden: metadata.hidden,
				internal: !!event.rawEvent.external_user_name,
				text: titleAndText ? titleAndText[2].trim() : metadata.content.trim(),
				title: titleAndText ? titleAndText[1] : undefined,
			},
			source: {
				service: event.source,
				message: event.rawEvent.id,
				flow,
				thread,
				url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
				username: 'duff', // gets replaced
			},
		};
		// If the data provided a username
		if (event.rawEvent.external_user_name) {
			cookedEvent.source.username = event.rawEvent.external_user_name;
			return Promise.resolve({
				context: `${event.source}.${event.cookedEvent.context}`,
				type: this.eventIntoMessageType(event),
				cookedEvent,
				rawEvent: event.rawEvent,
				source: event.source,
			});
		}
		return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
			.then((user) => {
				cookedEvent.source.username = user.nick;
				return({
					context: `${event.source}.${event.cookedEvent.context}`,
					type: this.eventIntoMessageType(event),
					cookedEvent,
					rawEvent: event.rawEvent,
					source: 'messenger',
				});
			});
	}

	public messageIntoConnectionDetails(message: TransmitInformation): Promise<FlowdockConnectionDetails> {
		const promises: Array<Promise<string>> = _.map(this.hubs, (hub) => {
			return hub.fetchValue(message.hub.username, 'flowdock', 'token');
		});
		return Promise.any(promises)
		.then((token) => {
			return {
				organization: this.organization,
				token,
			};
		});
	}

	public messageIntoEmitDetails(message: TransmitInformation): {method: string[], payload: FlowdockEmitData} {
		const org = this.organization;
		const flow = message.target.flow;
		const title = message.details.title;
		const thread = message.target.thread;
		switch (message.action) {
			case MessageAction.CreateThread:
				if (!title) {
					throw new ProcBotError(ProcBotErrorCode.IncompleteMessage, 'Cannot create a thread without a title');
				}
				return {method: ['post'], payload: {
					path: `/flows/${org}/${flow}/messages`,
					payload: {
						// The concatenated string, of various data nuggets, to emit
						content: `${title}\n--\n${message.details.text}\n${Translator.stringifyMetadata(message, 'emoji')}`,
						event: 'message',
						external_user_name: message.details.internal ? undefined : message.source.username.substring(0, 16),
					},
				}};
			case MessageAction.CreateMessage:
				if (!thread) {
					throw new ProcBotError(ProcBotErrorCode.IncompleteMessage, 'Cannot create a comment without a thread.');
				}
				return { method: ['post'], payload: {
					path: `/flows/${org}/${flow}/threads/${thread}/messages`,
					payload: {
						content: `${message.details.text}\n${Translator.stringifyMetadata(message, 'emoji')}`,
						event: 'message',
						external_user_name: message.details.internal ? undefined : message.source.username.substring(0, 16),
					}
				}};
			case MessageAction.ReadConnection:
				if (!thread) {
					throw new ProcBotError(ProcBotErrorCode.IncompleteMessage, 'Cannot search for connections without a thread.');
				}
				return { method: ['get'], payload: {
					path: `/flows/${org}/${flow}/threads/${thread}/messages`,
					payload: {
						search: `This thread is mirrored in [${message.source.service} thread`,
					},
				}};
			default:
				throw new ProcBotError(
					ProcBotErrorCode.UnsupportedMessageAction, `${message.action} not supported on ${message.target.service}`
				);
		}
	}

	public responseIntoMessageResponse(
		message: TransmitInformation, response: FlowdockResponse
	): MessageResponseData {
		switch (message.action) {
			case MessageAction.CreateThread:
			case MessageAction.CreateMessage:
				const thread = response.thread_id;
				const org = this.organization;
				const flow = message.target.flow;
				const url = `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`;
				return {
					message: response.id,
					thread: response.thread_id,
					url,
				};
			case MessageAction.ReadConnection:
				if (response.length > 0) {
					return {
						thread: response[0].content.match(/This thread is mirrored in \[(?:\w+) thread ([\d\w_]+)]/i)[1]
					};
				}
				throw new ProcBotError(ProcBotErrorCode.NoConnectionFound, 'No connected thread found by querying Flowdock.');
			default:
				throw new Error(`${message.action} not supported on ${message.target.service}`);
		}
	}

	/**
	 * Utility function to structure the flowdock session as a promise.
	 * @param path    Endpoint to retrieve.
	 * @param search  Optional, some words which may be used to shortlist the results.
	 * @returns       Response from the session.
	 */
	private fetchFromSession = (path: string, search?: string): Promise<any> => {
		return new Promise<any>((resolve, reject) => {
			this.session.get(path, {search}, (error?: Error, result?: any) => {
				if (result) {
					resolve(result);
				} else {
					reject(error);
				}
			});
		});
	}
}

export function createTranslator(data: FlowdockConnectionDetails, hubs: DataHub[]): Translator.Translator {
	return new FlowdockTranslator(data, hubs);
}
