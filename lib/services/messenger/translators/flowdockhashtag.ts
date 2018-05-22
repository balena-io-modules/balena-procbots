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
import { FlowdockConstructor, FlowdockEmitInstructions, FlowdockEvent } from '../../flowdock-types';
import { MessengerAction, MessengerEvent, TransmitInformation } from '../../messenger-types';
import { FlowdockTranslator } from './flowdock';
import { Translator, TranslatorError } from './translator';
import { MetadataEncoding } from './translator-scaffold';
import { MetadataConfiguration, TranslatorErrorCode } from './translator-types';

/**
 * Class to enable the translating between messenger standard forms and service
 * specific forms.
 */
export class FlowdockHashtagTranslator extends FlowdockTranslator implements Translator {
	/**
	 * Converts a provided message object into instructions to read a thread for connections.
	 * @param orgId    Parameterised ID of the organisation.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static readConnectionToEmit(message: TransmitInformation): Promise<FlowdockEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot search for connections without a thread.'
			));
		}
		// Bundle for the session.
		return Promise.resolve({
			method: ['get'],
			payload: {
				path: `/flows/${threadId}/messages`,
				payload: {
					limit: '100', // Default is 30, but there is literally no reason why we wouldn't ask for as many as we can
					search: `${message.source.service} thread`,
				},
			}
		});
	}

	/**
	 * Converts a provided message object into instructions to create a message.
	 * @param orgId           Parameterised ID of the organisation.
	 * @param metadataConfig  Configuration of how to encode metadata.
	 * @param message         object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createMessageToEmit(
		metadataConfig: MetadataConfiguration,
		message: TransmitInformation
	): Promise<FlowdockEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a comment without a thread.'
			));
		}
		// Bundle for the session.
		return Promise.resolve({
			method: ['post'],
			payload: {
				path: `/flows/${threadId}/messages`,
				payload: {
					content: FlowdockTranslator.createFormattedText(
						message.details.text,
						{
							metadata: FlowdockTranslator.stringifyMetadata(message, MetadataEncoding.Flowdock, metadataConfig),
							prefix: message.details.hidden ? '' : '% ',
						},
						metadataConfig,
					),
					event: 'message',
					external_user_name: message.details.handle.replace(/\s/g, '_'),
				}
			}
		});
	}

	constructor(data: FlowdockConstructor, metadataConfig: MetadataConfiguration) {
		super(data, metadataConfig);
		this.emitConverters[MessengerAction.ReadConnection] =
			_.partial(FlowdockHashtagTranslator.readConnectionToEmit);
		this.emitConverters[MessengerAction.CreateMessage] =
			_.partial(FlowdockHashtagTranslator.createMessageToEmit, metadataConfig);
		this.emitConverters[MessengerAction.CreateConnection] =
			_.partial(FlowdockHashtagTranslator.createMessageToEmit, metadataConfig);
	}

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param message  Message information, not used.
	 * @returns        The details required to construct an emitter.
	 */
	public messageIntoEmitterConstructor(message: TransmitInformation): FlowdockConstructor {
		const basic = super.messageIntoEmitterConstructor(message);
		basic.serviceName = 'flowdockhashtag';
		return basic;
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to an array of message objects in the standard form
	 */
	public eventIntoMessages(event: FlowdockEvent): Promise<MessengerEvent[]> {
		const details = this.eventIntoMessageDetails(event);
		return Promise.props({
			firstMessage: FlowdockTranslator.fetchFromSession(this.session, details.paths.firstMessage),
			username: this.fetchAlias(event),
			messages: FlowdockTranslator.fetchFromSession(
				this.session,
				details.paths.messages,
			)
		})
		.then((fetchedDetails) => {
			const firstMessageAsEvent = _.merge(_.cloneDeep(event), { rawEvent: fetchedDetails });
			const firstMessageDetails = this.eventIntoMessageDetails(firstMessageAsEvent);
			const hashtags: string[] = [];
			_.forEach(fetchedDetails.messages, (message) => {
				_.forEach(message.content.match(/#\w+/g), (match) => {
					hashtags.push(match.replace(/^#/, ''));
				});
			});
			return _.map(_.uniq(hashtags), (flow) => {
				return {
					cookedEvent: {
						details: {
							service: details.message.metadata.service || 'flowdockhashtag',
							flow: details.message.metadata.flow || flow,
							handle: fetchedDetails.username,
							hidden: details.message.metadata.hidden,
							tags: [],
							text: details.message.text.replace(/#/g, '#.'),
							time: details.message.time,
							title: _.get(firstMessageDetails, ['message', 'title'], '').replace(/#/g, '#.')
						},
						source: {
							service: 'flowdockhashtag',
							message: event.rawEvent.id,
							flow,
							thread: `${details.ids.flow}/threads/${details.ids.thread}`,
							url: details.paths.thread,
							username: fetchedDetails.username
						},
					},
					context: event.context,
					type: event.type,
					rawEvent: event.rawEvent,
					source: 'flowdockhashtag',
				};
			});
		});
	}
}

/**
 * Builds a translator that will convert service specific information to and from Messenger format.
 * @param data            Construction details for creating a session.
 * @param metadataConfig  Configuration of how to encode metadata.
 * @returns               A translator, ready to interpret communications.
 */
export function createTranslator(data: FlowdockConstructor, metadataConfig: MetadataConfiguration): Translator {
	return new FlowdockHashtagTranslator(data, metadataConfig);
}
