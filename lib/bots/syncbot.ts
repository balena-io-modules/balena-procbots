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
	FlowDefinition, MessageAction, MessageEmitResponse, MessageEvent,
	MessageInformation, MessageListenerMethod, TransmitInformation,
} from '../services/messenger-types';
import { createDataHub } from '../services/messenger/datahubs/datahub';
import { Logger, LogLevel } from '../utils/logger';

export class SyncBot extends ProcBot {
	private static makeRouter(
		from: FlowDefinition, to: FlowDefinition, messenger: MessengerService, logger: Logger
	): MessageListenerMethod {
		return (_registration, event: MessageEvent) => {
			const data = event.cookedEvent;
			if (
				from.service === data.source.service &&
				from.flow === data.source.flow &&
				data.details.genesis !== 'system'
			) {
				const text = data.details.text;
				logger.log(LogLevel.INFO, `---> Heard '${text}' on ${from.service}.`);
				return SyncBot.readConnectedThread(to, messenger, data)
				.then(() => {
					SyncBot.createThreadAndConnect(to, messenger, data)
					.then(() => {
						logger.log(LogLevel.INFO, `---> Emitted '${text}' to ${to.service}.`);
					});
				});
			}
			// The event received doesn't match the profile being routed, so no-op is the correct action.
			return Promise.resolve();
		};
	}

	private static readConnectedThread(
		to: FlowDefinition, messenger: MessengerService, data: MessageInformation
	): Promise<MessageEmitResponse> {
		const readConnection: TransmitInformation = {
			action: MessageAction.ReadConnection,
			details: data.details,
			hub: {
				username: process.env.SYNCBOT_NAME,
			},
			source: data.source,
			target: {
				flow: to.flow,
				service: to.service,
				username: process.env.SYNCBOT_NAME,
			},
		};
		return messenger.sendData({
			contexts: {
				messenger: readConnection,
			},
			source: 'syncbot',
		});
	}

	private static createThreadAndConnect(
		to: FlowDefinition, messenger: MessengerService, data: MessageInformation
	): Promise<MessageEmitResponse> {
		const createThread: TransmitInformation = {
			action: MessageAction.CreateThread,
			details: data.details,
			hub: {
				username: data.source.username,
			},
			source: data.source,
			target: {
				flow: to.flow,
				service: to.service,
				username: data.source.username,
			},
		};

		const createConnections: TransmitInformation = {
			action: MessageAction.CreateMessage,
			details: {
				genesis: 'system',
				hidden: true,
				internal: true,
				text: 'This ticket is mirrored in ' // will be appended
			},
			hub: {
				username: process.env.SYNCBOT_NAME,
			},
			source: { // this message is being created from nothing
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

		return messenger.sendData({
			contexts: {
				messenger: createThread,
			},
			source: 'syncbot',
		}).then((emitResponse: MessageEmitResponse) => {
			const response = emitResponse.response;
			if (response) {
				const connectTarget = _.cloneDeep(createConnections);
				connectTarget.target = {
					flow: data.source.flow,
					service: data.source.service,
					username: process.env.SYNCBOT_NAME,
					thread: data.source.thread,
				};
				connectTarget.details.text += `[${createThread.target.service} thread ${response.thread}](${response.url})`;

				const sourceDetails = data.source;
				const connectSource = _.cloneDeep(createConnections);
				connectSource.target = {
					flow: createThread.target.flow,
					service: createThread.target.service,
					username: process.env.SYNCBOT_NAME,
					thread: response.thread,
				};
				connectSource.details.text += `[${sourceDetails.service} thread ${sourceDetails.thread}](${sourceDetails.url})`;

				return Promise.all([
					messenger.sendData({contexts: {messenger: connectTarget}, source: 'syncbot'}),
					messenger.sendData({contexts: {messenger: connectSource}, source: 'syncbot'}),
				]).return(emitResponse);
			}
			return Promise.resolve(emitResponse);
		});
	}

	constructor(name = 'SyncBot') {
		super(name);
		const logger = new Logger();

		// Build the dataHub array
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
