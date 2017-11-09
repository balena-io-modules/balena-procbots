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
	BasicMessageInformation, CreateThreadResponse, FlowDefinition,
	MessageListener, MessengerAction, MessengerEmitResponse,
	MessengerEvent, SolutionIdea, SolutionIdeas,
	ThreadDefinition, TransmitInformation,
} from '../services/messenger-types';
import { ServiceType } from '../services/service-types';
import { Logger, LogLevel } from '../utils/logger';

/**
 * A bot that mirrors threads across services.
 */
export class SyncBot extends ProcBot {
	/**
	 * Provide a method that:
	 *  * Encloses details available in advance.
	 *  * Reacts to details provided by each event.
	 * @param from       Definition, {service, flow}, of the flow being listened to.
	 * @param to         Definition {service, flow} of the flow being emitted to.
	 * @param messenger  Service to use to interact with the cloud.
	 * @param logger     Logger to use to interact with the maintainers.
	 * @returns          Function that processes events from the messenger.
	 */
	private static makeRouter(
		from: FlowDefinition, to: FlowDefinition, messenger: MessengerService, logger: Logger
	): MessageListener {
		// This method returns a method that in turn processes events.
		return (_registration, event: MessengerEvent) => {
			const data = event.cookedEvent;
			// Check that the event is one we want to synchronise.
			const sourceText = `${data.source.service} (${data.source.flow})`;
			const fromText = `${from.service} (${from.flow})`;
			const toText = `${to.service} (${to.flow})`;
			// This will find everything before the first thing that is in the set of new line characters
			const firstLine = data.details.text.split(/[\r\n]/)[0];
			logger.log(
				LogLevel.DEBUG,
				`---> Considering '${firstLine}' on ${sourceText}, from ${fromText} to ${toText}. ${JSON.stringify(data)}`,
			);
			if (
				from.service === data.source.service &&
				from.flow === data.source.flow &&
				to.service !== data.details.genesis &&
				// https://github.com/resin-io-modules/resin-procbots/issues/301
				!data.details.intercomHack
			) {
				// Log that we received this event.
				logger.log(LogLevel.INFO, `---> Actioning '${firstLine}' to ${toText}.`);
				try {
					// This allows syncbot to represent specific other accounts.
					const aliasString = process.env.SYNCBOT_ALIAS_USERS;
					const aliases = aliasString ? _.map(JSON.parse(aliasString), _.toLower) : [];
					if (_.includes(aliases, data.details.handle.toLowerCase())) {
						data.details.handle = process.env.SYNCBOT_NAME;
						data.source.username = process.env.SYNCBOT_NAME;
					}
				} catch (error) {
					logger.log(LogLevel.WARN, 'Misconfiguration in SyncBot aliases.');
				}
				// Find details of any connections stored in the originating thread.
				return SyncBot.readConnectedThread(to, messenger, data)
				// Then comment on or create a thread
				.then((threadDetails: MessengerEmitResponse) => {
					// If the search resolved with a response.
					const threadId = _.get(threadDetails, 'response.thread', false);
					if (threadId) {
						logger.log(LogLevel.DEBUG, `---> Creating comment '${firstLine}' on ${toText}.`);
						// Comment on the found thread
						return SyncBot.createComment({
							service: to.service, flow: to.flow, thread: threadId,
						}, messenger, data)
						// Pass through details of the thread updated
						.then((emitResponse) => {
							if (emitResponse.err) {
								return emitResponse;
							}
							return {
								response: {
									thread: threadId,
								},
								source: emitResponse.source,
							};
						});
					}
					logger.log(LogLevel.DEBUG, `---> Creating thread '${firstLine}' on ${toText}.`);
					// Create a thread if the quest for connections didn't find any
					return SyncBot.createThreadAndConnect(to, messenger, data);
				})
				// Then report that we have passed the message on
				.then((response: MessengerEmitResponse) => {
					if (response.err) {
						logger.log(LogLevel.WARN, JSON.stringify({message: response.err.message, data, error: response.err}));
						return SyncBot.createErrorComment(to, messenger, data, response.err)
						// Ignore the response from the messenger, SyncBot only cares that it's happened.
						.return(response);
					} else {
						logger.log(LogLevel.DEBUG, `---> Emitted '${firstLine}' to ${toText}.`);
					}
					return response;
				})
				// Then update the tags on the thread
				.then((emitResponse: MessengerEmitResponse) => {
					// If the process this far resolved with a response
					const threadId = _.get(emitResponse, 'response.thread', false);
					if (threadId && data.details.tags) {
						// Request that the tags be updated
						return SyncBot.updateTags({
							service: to.service,
							flow: to.flow,
							thread: threadId,
						}, messenger, data)
						// The upstream expectations are for a promise that resolves to void when complete.
						.return();
					}
				});
			}
			// The event received doesn't match the profile being routed, so nothing is the correct action.
			return Promise.resolve();
		};
	}

	/**
	 * Promise to post to the thread details of the error, and any likely fixes.
	 * @param to         The location we attempted to synchronise the data to.
	 * @param messenger  Service to use to communicate this message.
	 * @param data       The payload we attempted to synchronise.
	 * @param error      The error from the service.
	 * @returns          Promise that resolves to the response from creating the message.
	 */
	private static createErrorComment(
		to: FlowDefinition, messenger: MessengerService, data: BasicMessageInformation, error: Error
	): Promise<MessengerEmitResponse> {
		const solution = SyncBot.getErrorSolution(to.service, error.message);
		const fixes = solution.fixes.length > 0 ?
			` * ${solution.fixes.join('\r\n * ')}` :
			process.env.SYNCBOT_ERROR_UNDOCUMENTED;
		const echoData: BasicMessageInformation = {
			details: {
				genesis: to.service,
				handle: process.env.SYNCBOT_NAME,
				hidden: true,
				internal: true,
				tags: data.details.tags,
				text: `${to.service} reports \`${solution.description}\`.\r\n${fixes}\r\n`,
				title: data.details.title,
			},
			source: {
				message: 'duff',
				thread: 'duff',
				service: to.service,
				username: process.env.SYNCBOT_NAME,
				flow: to.flow,
			},
		};
		return SyncBot.createComment(data.source, messenger, echoData);
	}

	/**
	 * Find, from the environment, a possible solution to the provided error message.
	 * @param service  Name of the service reporting the error.
	 * @param message  Message that the service reported.
	 * @returns        A suggested fix to the error.
	 */
	private static getErrorSolution(service: string, message: string): SolutionIdea {
		try {
			const solutionMatrix = JSON.parse(process.env.SYNCBOT_ERROR_SOLUTIONS);
			const solutionIdeas: SolutionIdeas = _.get(solutionMatrix, service, {});
			const filteredSolutions = _.filter(solutionIdeas, (_value: any, pattern: string) => {
				return new RegExp(pattern).test(message);
			});
			if (filteredSolutions.length > 0) {
				return filteredSolutions[0];
			} else {
				return {
					description: message,
					fixes: [],
				};
			}
		} catch (error) {
			throw new Error('SYNCBOT_ERROR_SOLUTIONS not a valid JSON object of service => { message => resolution }.');
		}
	}

	/**
	 * Pass to the messenger a request to update the tags.
	 * @param  to         Definition {service, flow, thread} of the thread being emitted to.
	 * @param  messenger  Service to use to interact with the cloud.
	 * @param  data       Event that is being processed.
	 * @returns           Promise to update the tags and respond with the threadId updated.
	 */
	private static updateTags(
		to: ThreadDefinition, messenger: MessengerService, data: BasicMessageInformation
	): Promise<MessengerEmitResponse> {
		// Bundle a tag update request, it's mainly as per the `to` and `data` passed in.
		const updateTags: TransmitInformation = {
			action: MessengerAction.UpdateTags,
			details: data.details,
			source: data.source,
			target: {
				flow: to.flow,
				service: to.service,
				thread: to.thread,
				// Perform this operation as the SyncBot user.
				username: process.env.SYNCBOT_NAME,
			},
		};
		// Request that the payload created above be sent.
		return messenger.sendData({
			contexts: {
				messenger: updateTags,
			},
			source: 'syncbot',
		});
	}

	/**
	 * Pass to the messenger a request to create a comment.
	 * @param  to         Definition {service, flow, thread} of the thread being emitted to.
	 * @param  messenger  Service to use to interact with the cloud.
	 * @param  data       Event that is being processed.
	 * @returns           Promise to create the comment and respond with the threadId updated.
	 */
	private static createComment(
		to: ThreadDefinition, messenger: MessengerService, data: BasicMessageInformation
	): Promise<MessengerEmitResponse> {
		// Bundle a comment create request, it's a mixture of the `to` and `data` passed in.
		const createComment: TransmitInformation = {
			action: MessengerAction.CreateMessage,
			details: data.details,
			source: data.source,
			target: {
				flow: to.flow,
				service: to.service,
				thread: to.thread,
				username: data.source.username,
			},
		};
		// Request that the payload created above be sent.
		return messenger.sendData({
			contexts: {
				messenger: createComment,
			},
			source: 'syncbot',
		});
	}

	/**
	 * Pass to the messenger a request to create a comment.
	 * @param  to         Definition {service, flow, thread} of the thread being emitted to.
	 * @param  messenger  Service to use to interact with the cloud.
	 * @param  data       Event that is being processed.
	 * @returns           Promise to create the comment and respond with the threadId updated.
	 */
	private static readConnectedThread(
		to: FlowDefinition, messenger: MessengerService, data: BasicMessageInformation
	): Promise<MessengerEmitResponse> {
		// Bundle a read connection request, it's a bit weird compared to others in this file.
		// I've typed this here to split the union type earlier, and make error reports more useful.
		const readConnection: TransmitInformation = {
			action: MessengerAction.ReadConnection,
			details: data.details,
			// If credential details are required then consult with the SyncBot user.
			// Most of `source` doesn't matter, except `service`.
			source: {
				flow: to.flow,
				message: 'duff',
				// The service you wish to find a connection for.
				service: to.service,
				thread: 'duff',
				username: process.env.SYNCBOT_NAME,
			},
			// This feels paradoxical because the target of the read request ...
			// is the place the event came from.
			target: {
				flow: data.source.flow,
				service: data.source.service,
				thread: data.source.thread,
				username: process.env.SYNCBOT_NAME,
			},
		};
		// Request that the payload created above be sent, which will resolve to the threadId connected.
		return messenger.sendData({
			contexts: {
				messenger: readConnection,
			},
			source: 'syncbot',
		});
	}

	/**
	 * Pass to the messenger requests to create a thread and connect.
	 * @param  to         Definition {service, flow} of the flow being emitted to.
	 * @param  messenger  Service to use to interact with the cloud.
	 * @param  data       Event that is being processed.
	 * @returns           Promise to create the thread and respond with the threadId.
	 */
	private static createThreadAndConnect(
		to: FlowDefinition, messenger: MessengerService, data: BasicMessageInformation
	): Promise<MessengerEmitResponse> {
		// Bundle a thread creation request.
		// I've typed this here to split the union type earlier, and make error reports more useful.
		const createThread: TransmitInformation = {
			action: MessengerAction.CreateThread,
			details: data.details,
			source: data.source,
			target: {
				flow: to.flow,
				service: to.service,
				username: data.source.username,
			},
		};
		// Request that the payload created above be sent.
		return messenger.sendData({
			contexts: {
				messenger: createThread,
			},
			source: 'syncbot',
		}).then((emitResponse: MessengerEmitResponse) => {
			// Insist that the response from creating a thread is a CreateThreadResponse for typing.
			const response = emitResponse.response as CreateThreadResponse;
			// Check that we actually got a correct resolution, not a promise that resolved with an error.
			// I've typed this here to split the union type earlier, and make error reports more useful.
			if (response) {
				// Bundle a payload that can be easily mutated to each of the source and target threads.
				const genericConnect: TransmitInformation = {
					// #251 This could be .CreateConnection, and translated
					action: MessengerAction.CreateMessage,
					// A message that advertises the connected thread.
					details: {
						genesis: 'duff', // will be replaced
						handle: process.env.SYNCBOT_NAME,
						hidden: true,
						internal: true,
						tags: data.details.tags,
						text: 'This is mirrored in ', // will be appended
						title: data.details.title,
					},
					// this message is being created from nothing.
					source: {
						message: 'duff',
						thread: 'duff',
						flow: 'duff',
						service: 'duff', // will be replaced
						username: 'duff',
					},
					target: {
						flow: 'duff', // will be replaced
						service: 'duff', // will be replaced
						// This is happening using SyncBot's credentials.
						username: process.env.SYNCBOT_NAME,
						thread: 'duff' // will be replaced
					}
				};

				// Clone and mutate the generic payload for emitting to the originating thread.
				const updateOriginating = _.cloneDeep(genericConnect);
				// This should update the thread that this process sourced from.
				updateOriginating.target = {
					flow: data.source.flow,
					service: data.source.service,
					username: process.env.SYNCBOT_NAME,
					thread: data.source.thread,
				};
				// This comments on the original thread about the new thread.
				updateOriginating.details.text += `[${createThread.target.service} thread ${response.thread}](${response.url})`;
				updateOriginating.details.genesis = createThread.target.service;
				updateOriginating.source.service = createThread.target.service;

				// Clone and mutate the generic payload for emitting to the created thread.
				const updateCreated = _.cloneDeep(genericConnect);
				// This should update the thread that this process created.
				updateCreated.target = {
					flow: createThread.target.flow,
					service: createThread.target.service,
					username: process.env.SYNCBOT_NAME,
					thread: response.thread,
				};
				// This comments on the new thread about the original thread..
				updateCreated.details.text += `[${data.source.service} thread ${data.source.thread}](${data.source.url})`;
				updateCreated.details.genesis = data.source.service;
				updateCreated.source.service = data.source.service;

				// Request that the payloads created just above be sent.
				return Promise.all([
					messenger.sendData({contexts: {messenger: updateOriginating}, source: 'syncbot'}),
					messenger.sendData({contexts: {messenger: updateCreated}, source: 'syncbot'}),
				]).return(emitResponse);
			}
			// If we failed to create a thread then just pass this back unmolested.
			return Promise.resolve(emitResponse);
		});
	}

	/**
	 * Consults the environment for configuration to create a service that aggregates many other services.
	 * @returns  Service that wraps and translates specified sub services.
	 */
	private static makeMessenger(): MessengerService {
		// Created this as its own function to scope the `let` a little
		let listenerConstructors = [];
		try {
			listenerConstructors = JSON.parse(process.env.SYNCBOT_LISTENER_CONSTRUCTORS);
		} catch (error) {
			throw new Error('SYNCBOT_LISTENER_CONSTRUCTORS not a valid JSON array.');
		}

		const messenger = new MessengerService({
			server: parseInt(process.env.SYNCBOT_PORT, 10),
			subServices: listenerConstructors,
			type: ServiceType.Listener,
		});

		if (messenger) {
			return messenger;
		}
		throw new Error('Could not create Messenger.');
	}

	/**
	 * Consults the environment to find the equivalencies between flows.
	 * @returns  Nested array, each top level array is an array of mirrored flows.
	 */
	private static makeMappings(): FlowDefinition[][] {
		// Created this as its own function so the try/catch stay close together
		// The alternative would be a let in the super scope.
		try {
			return JSON.parse(process.env.SYNCBOT_MAPPINGS);
		} catch (error) {
			throw new Error('SYNCBOT_MAPPINGS not a valid JSON array.');
		}
	}

	constructor(name = 'SyncBot') {
		super(name);
		const logger = new Logger();
		const messenger = SyncBot.makeMessenger();

		// Go around all the mappings defined by the configuration.
		const mappings = SyncBot.makeMappings();
		for (const mapping of mappings) {
			// Keeping track of prior, so we can find each adjacent pair.
			let priorFlow = null;
			for (const focusFlow of mapping) {
				if (priorFlow) {
					// Register a mirroring from the first of the pair, to the second.
					messenger.registerEvent({
						events: ['message'],
						listenerMethod: SyncBot.makeRouter(priorFlow, focusFlow, messenger, logger),
						name: `${priorFlow.service}.${priorFlow.flow}=>${focusFlow.service}.${focusFlow.flow}`,
					});
					// Register a mirroring from the second of the pair, to the first.
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
