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
import { ProcBot } from '../framework/procbot';
import { MessengerService } from '../services/messenger';
import {
	FlowDefinition, MessageEmitResponse, MessageEvent, MessageListenerMethod, TransmitContext,
} from '../services/messenger-types';
import { createDataHub } from '../services/messenger/datahubs/datahub';
import { Logger, LogLevel } from '../utils/logger';

export class SyncBot extends ProcBot {
	private static makeRouter(
		from: FlowDefinition, to: FlowDefinition, emitter: MessengerService, logger?: Logger
	): MessageListenerMethod {
		return (_registration, event: MessageEvent) => {
			if (
				from.service === event.cookedEvent.source.service &&
				from.flow === event.cookedEvent.source.flow &&
				event.cookedEvent.details.genesis !== 'system'
			) {
				const transmitMessage: TransmitContext = {
					action: 'createThread',
					details: event.cookedEvent.details,
					hub: {
						username: event.cookedEvent.source.username,
					},
					source: event.cookedEvent.source,
					target: {
						flow: to.flow,
						service: to.service,
						username: event.cookedEvent.source.username,
					},
				};

				const updateConnections: TransmitContext = {
					action: 'createComment',
					details: {
						genesis: 'system',
						hidden: true,
						internal: true,
						text: 'This ticket is mirrored in ' // will be appended
					},
					hub: {
						username: process.env.SYNCBOT_NAME,
					},
					source: {
						message: 'duff',
						thread: 'duff',
						flow: 'duff',
						service: 'system',
						username: 'duff',
					},
					target: {
						flow: 'duff', // will be replaced
						service: 'duff', // will be replaced
						username: process.env.SYNCBOT_NAME,
						thread: 'duff' // will be replaced
					}
				};

				return emitter.sendData({
					contexts: {
						messenger: transmitMessage,
					},
					source: 'syncbot',
				}).then((emitResponse: MessageEmitResponse) => {
					const response = emitResponse.response;
					if (response) {
						const updateSource = _.cloneDeep(updateConnections);
						updateSource.target = {
							flow: event.cookedEvent.source.flow,
							service: event.cookedEvent.source.service,
							username: process.env.SYNCBOT_NAME,
							thread: event.cookedEvent.source.thread,
						};
						updateSource.details.text += `[${to.service} thread ${response.thread}](${response.url})`;

						const sourceDetails = event.cookedEvent.source;
						const updateTarget = _.cloneDeep(updateConnections);
						updateTarget.target = {
							flow: to.flow,
							service: to.service,
							username: process.env.SYNCBOT_NAME,
							thread: response.thread,
						};
						updateTarget.details.text += `[${from.service} thread ${sourceDetails.thread}](${sourceDetails.url})`;

						return Promise.all([
							emitter.sendData({contexts: {messenger: updateSource}, source: 'syncbot'}),
							emitter.sendData({contexts: {messenger: updateTarget}, source: 'syncbot'}),
						]).then(() => {
							if (logger) {
								logger.log(LogLevel.INFO, `---> Emitted '${event.cookedEvent.details.text}' to ${to.service}.`);
							}
						});
					}
				});
			}
			// The event received doesn't match the profile being routed, so no-op is the correct action.
			return Promise.resolve();
		};
	}

	constructor(name = 'SyncBot') {
		super(name);
		const logger = new Logger();

		// Build the dataHub object
		const dataHub = createDataHub(
			process.env.SYNCBOT_DATAHUB_SERVICE,
			JSON.parse(process.env.SYNCBOT_DATAHUB_CONSTRUCTOR)
		);
		if (!dataHub) {
			throw new Error('Could not create dataHub.');
		}
		const dataHubs = [
			createDataHub('configuration', 'syncbot'),
			dataHub,
		];

		// Build the messenger object, with the sub-listeners
		const messenger = new MessengerService(
			{
				dataHubs,
				subServices: JSON.parse(process.env.SYNCBOT_LISTENER_CONSTRUCTORS),
			},
			true,
		);
		if (!messenger) {
			throw new Error('Could not create Messenger.');
		}

		// Register each edge in the mappings array bidirectionally
		const mappings: FlowDefinition[][] = JSON.parse(process.env.SYNCBOT_MAPPINGS);
		for(const mapping of mappings) {
			let priorFlow = null;
			for(const focusFlow of mapping) {
				if(priorFlow) {
					messenger.registerEvent({
						events: ['message'],
						listenerMethod: SyncBot.makeRouter(priorFlow, focusFlow, messenger, logger),
						name: `${priorFlow.service}.${priorFlow.flow}=>${focusFlow.service}.${focusFlow.flow}`,
					});
					messenger.registerEvent({
						events: ['message'],
						listenerMethod: SyncBot.makeRouter(focusFlow, priorFlow, messenger, logger),
						name: `${focusFlow.service}.${focusFlow.flow}=>${priorFlow.service}.${priorFlow.flow}`,
					});
				}
				priorFlow = focusFlow;
			}
		}
	}
}

export function createBot(): SyncBot {
	return new SyncBot(process.env.SYNCBOT_NAME);
}
