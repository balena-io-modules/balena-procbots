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
import { FlowdockConnectionDetails, FlowdockEmitContext, FlowdockEvent } from '../../services/flowdock-types';
import { MessageContext, MessageEvent, TransmitContext } from '../../services/messenger-types';
import * as Translator from './translator';

export class FlowdockTranslator implements Translator.Translator {
	private session: Session;
	private organization: string;

	constructor(data: FlowdockConnectionDetails) {
		this.session = new Session(data.token);
		this.organization = data.organization;
	}

	/**
	 * Translate the provided event, enqueued by the service, into a message context.
	 * @param event  Data in the form raw to the service.
	 */
	public eventIntoMessage(event: FlowdockEvent): Promise<MessageEvent> {
		// Separate out some parts of the message
		const metadata = Translator.extractMetadata(event.rawEvent.content, 'emoji');
		const titleAndText = metadata.content.match(/^(.*)\n--\n((?:\r|\n|.)*)$/);
		const flow = event.cookedEvent.flow;
		const thread = event.rawEvent.thread_id;
		const userId = event.rawEvent.user;
		const org = this.organization;
		const rawEvent: MessageContext = {
			// action: MessageAction.Create,
			// first: event.rawEvent.id === event.rawEvent.thread.initial_message,
			details: {
				genesis: metadata.genesis || event.source,
				hidden: metadata.hidden,
				text: titleAndText ? titleAndText[2] : metadata.content,
				title: titleAndText ? titleAndText[1] : undefined,
			},
			source: {
				service: event.source,
				message: event.rawEvent.id,
				flow,
				thread,
				url: `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`,
				user: 'duff', // gets replaced
			},
		};
		// If the data provided a username
		if (event.rawEvent.external_user_name) {
			rawEvent.source.user = event.rawEvent.external_user_name;
			return Promise.resolve({
				cookedEvent: {
					// TODO: This to translate event.cookedEvent.type
					context: `${event.source}.${event.cookedEvent.context}`,
					event: 'message',
				},
				rawEvent,
				source: event.source,
			});
		}
		return this.fetchFromSession(`/organizations/${org}/users/${userId}`)
		.then((user) => {
			rawEvent.source.user = user.nick;
			return({
				cookedEvent: {
					// TODO: This to translate event.cookedEvent.type
					context: `${event.source}.${event.cookedEvent.context}`,
					event: 'message',
				},
				rawEvent,
				source: event.source,
			});
		});
	}

	/**
	 * Translate the provided message context into an emit context.
	 * @param message  Standard form of the message.
	 */
	public messageIntoEmitCreateMessage(message: TransmitContext): Promise<FlowdockEmitContext> {
		// Build a string for the title, if appropriate.
		// TODO: Replace the reliance on the first boolean
		const titleText = /* message.details.first && */ message.details.title ? message.details.title + '\n--\n' : '';
		return new Promise<FlowdockEmitContext>((resolve) => {
			// TODO: Remember that this used to have a pass-through and probably recycle that idea in messenger.ts
			resolve({
				method: 'POST',
				path: '/flows/${org}/${flow}/messages/',
				payload: {
					// The concatenated string, of various data nuggets, to emit
					content: titleText + message.details.text + '\n' + Translator.stringifyMetadata(message),
					event: 'message',
					// TODO: Something with this?!?!
					// external_user_name:
					// If this is using the generic token, then they must be an external user, so indicate this
					// 	message.toIds.token === this.data.token ? message.toIds.user.substring(0, 16) : undefined,
					thread_id: message.target.thread,
				},
			});
		});
	}

	/**
	 * Translate the provided message context into an emit context that will retrieve the thread history.
	 * @param message    Standard form of the message.
	 * @param shortlist  *DO NOT RELY ON THIS BEING USED.*  Purely optional optimisation.
	 *                   If the endpoint supports it then it may use this to shortlist the responses.
	 */
	public messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<FlowdockEmitContext> {
		// Query the API
		const org = this.organization;
		const firstWords = shortlist && shortlist.source.match(/^([\w\s]+)/i);
		if (firstWords) {
			return Promise.resolve({
				method: 'GET',
				path: `/flows/${org}/${message.source.flow}/threads/${message.source.thread}/messages`,
				payload: {
					search: firstWords[1],
				},
			});
		}
		return Promise.resolve({
			method: 'GET',
			path: `/flows/${org}/${message.source.flow}/threads/${message.source.thread}/messages`,
		});
	}

	/**
	 * Translate the provided generic name for an event into the service events to listen to.
	 * @param name  Generic name for an event.
	 */
	public eventNameIntoTriggers(name: string): string[] {
		const equivalents: {[key: string]: string[]} = {
			message: ['message'],
		};
		return equivalents[name];
	}

	/**
	 * Returns an array of all the service events that may be translated.
	 */
	public getAllTriggers(): string[] {
		return ['message'];
	}

	/**
	 * Utility function to structure the flowdock session as a promise.
	 * @param path    Endpoint to retrieve.
	 * @param search  Optional, some words which may be used to shortlist the results.
	 * @returns       Response from the session.
	 */
	private fetchFromSession = (path: string, search?: string): Promise<any> => {
		return new Promise<any>((resolve, reject) => {
			// The flowdock service both emits and calls back the error.
			// We're wrapping the emit in a promise reject and ignoring the error in callback
			this.session.on('error', reject);
			this.session.get(path, {search}, (_error?: Error, result?: any) => {
				this.session.removeListener('error', reject);
				if (result) {
					resolve(result);
				}
			});
		});
	}
}

export function createTranslator(data: FlowdockConnectionDetails): Translator.Translator {
	return new FlowdockTranslator(data);
}
