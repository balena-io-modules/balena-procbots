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
import * as _ from 'lodash';
import * as request from 'request-promise';
import {
	DiscourseConnectionDetails, DiscourseEmitData,
	DiscourseEvent, DiscourseResponse,
} from '../../discourse-types';
import {
	CreateMessageResponse, MessageAction, MessageEvent,
	MessageInformation, TransmitInformation,
} from '../../messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';

export class DiscourseTranslator implements Translator.Translator {
	private hubs: DataHub[];
	private connectionDetails: DiscourseConnectionDetails;
	private eventEquivalencies: {[generic: string]: string[]} = {
		message: ['post'],
	};

	constructor(data: DiscourseConnectionDetails, hubs: DataHub[]) {
		this.hubs = hubs;
		this.connectionDetails = data;
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

	public eventIntoMessage(event: DiscourseEvent): Promise<MessageEvent> {
		// Encode once the common parts of a request
		const getGeneric = {
			json: true,
			method: 'GET',
			qs: {
				api_key: this.connectionDetails.token,
				api_username: this.connectionDetails.username,
			},
			// appended before execution
			uri: `https://${this.connectionDetails.instance}`,
		};
		// Gather more complete details of the enqueued event
		const getPost = _.cloneDeep(getGeneric);
		getPost.uri += `/posts/${event.rawEvent.id}`;
		const getTopic = _.cloneDeep(getGeneric);
		getTopic.uri += `/t/${event.rawEvent.topic_id}`;
		return Promise.props({
			post: request(getPost),
			topic: request(getTopic),
		})
			.then((details: {post: any, topic: any}) => {
				// Gather metadata and resolve
				const metadata = Translator.extractMetadata(details.post.raw, 'img');
				const cookedEvent: MessageInformation = {
					details: {
						genesis: metadata.genesis || event.source,
						// post_type 4 seems to correspond to whisper
						hidden: details.post.post_type === 4,
						internal: details.post.staff,
						text: metadata.content.trim(),
						title: details.topic.title,
					},
					source: {
						service: event.source,
						// These come in as integers, but should be strings
						flow: details.topic.category_id.toString(),
						message: details.post.id.toString(),
						thread: details.post.topic_id.toString(),
						url: getTopic.uri,
						username: details.post.username,
					},
				};
				return {
					context: `${event.source}.${event.cookedEvent.context}`,
					type: this.eventIntoMessageType(event),
					cookedEvent,
					rawEvent: event.rawEvent,
					source: 'messenger',
				};
			});
	}

	public messageIntoConnectionDetails(message: TransmitInformation): Promise<DiscourseConnectionDetails> {
		const promises: Array<Promise<string>> = _.map(this.hubs, (hub) => {
			return hub.fetchValue(message.hub.username, 'discourse', 'token');
		});
		return Promise.any(promises)
		.then((token) => {
			return {
				token,
				username: message.target.username,
				instance: this.connectionDetails.instance,
			};
		});
	}

	public messageIntoEmitDetails(message: TransmitInformation): {method: string[], payload: DiscourseEmitData} {
		const title = message.details.title;
		const thread = message.target.thread;
		switch (message.action) {
			case MessageAction.CreateThread:
				if (!title) {
					throw new Error('Cannot create a thread without a title.');
				}
				return {method: ['request'], payload: {
					method: 'POST',
					path: '/posts',
					body: {
						category: message.target.flow,
						raw: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message, 'img')}`,
						title,
						unlist_topic: 'false',
					},
				}};
			case MessageAction.CreateMessage:
				if (!thread) {
					throw new Error('Cannot create a comment without a thread.');
				}
				return {method: ['request'], payload: {
					method: 'POST',
					path: '/posts',
					body: {
						raw: `${message.details.text}\n\n---\n${Translator.stringifyMetadata(message, 'img')}`,
						topic_id: thread,
						whisper: message.details.hidden ? 'true' : 'false',
					}
				}};
			default:
				throw new Error(`${message.action} not translatable to ${message.target.service} yet.`);
		}
	}

	public responseIntoMessageResponse(message: TransmitInformation, response: DiscourseResponse): CreateMessageResponse {
		switch (message.action) {
			case MessageAction.CreateThread:
			case MessageAction.CreateMessage:
				return {
					message: response.id,
					thread: response.topic_id,
					url: `https://${this.connectionDetails.instance}/t/${response.topic_id}`
				};
			default:
				throw new Error(`${message.action} not translatable to ${message.target.service} yet.`);
		}
	}
}

export function createTranslator(data: DiscourseConnectionDetails, hubs: DataHub[]): Translator.Translator {
	return new DiscourseTranslator(data, hubs);
}
