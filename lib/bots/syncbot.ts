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
import { ProcBot } from '../framework/procbot';
import { MessengerService } from '../services/messenger';
import {
	FlowDefinition, MessageEvent, MessageListenerMethod, TransmitContext,
} from '../services/messenger-types';
import { createDataHub } from '../services/messenger/datahubs/datahub';
import { Logger, LogLevel } from '../utils/logger';

export class SyncBot extends ProcBot {
	private static makeRouter(
		from: FlowDefinition, to: FlowDefinition, emitter: MessengerService, logger?: Logger
	): MessageListenerMethod {
		return (_registration, event: MessageEvent) => {
			if (from.service === event.cookedEvent.source.service && from.flow === event.cookedEvent.source.flow) {
				const transmitMessage: TransmitContext = {
					details: event.cookedEvent.details,
					hubUsername: event.cookedEvent.source.username,
					source: event.cookedEvent.source,
					target: {
						flow: to.flow,
						service: to.service,
						username: event.cookedEvent.source.username,
					},
				};
				return emitter.sendData({
					contexts: {
						messenger: transmitMessage,
					},
					source: 'messenger',
				}).then(() => {
					if(logger) {
						logger.log(LogLevel.INFO, `---> Emitted '${event.cookedEvent.details.text}' to ${to.service}.`);
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

		// Build the messenger object, with the sub-listeners
		const messenger = new MessengerService(
			{
				dataHub,
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
