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
	BasicMessageInformation,
	CreateThreadResponse,
	FlowDefinition,
	FlowMapping,
	MessageListener,
	MessengerAction,
	MessengerConnectionDetails,
	MessengerEmitResponse,
	MessengerEvent,
	SolutionIdea,
	SolutionIdeas,
	SolutionMatrix,
	ThreadDefinition,
	TransmitInformation,
} from '../services/messenger-types';
import { TranslatorError } from '../services/messenger/translators/translator';
import {
	MetadataConfiguration,
	TranslatorErrorCode,
} from '../services/messenger/translators/translator-types';
import { ServiceType } from '../services/service-types';
import { Logger, LogLevel } from '../utils/logger';

interface SyncBotConstructor {
	SYNCBOT_ALIAS_USERS: string[];
	SYNCBOT_ERROR_SOLUTIONS: SolutionMatrix;
	SYNCBOT_ERROR_UNDOCUMENTED: string;
	SYNCBOT_MAPPINGS: FlowMapping[];
	SYNCBOT_METADATA_CONFIG: MetadataConfiguration;
	SYNCBOT_PORT: string;
	SYNCBOT_NAME: string;
	SYNCBOT_LISTENER_CONSTRUCTORS: MessengerConnectionDetails;
	SYNCBOT_ARCHIVE_STRINGS: string[];
}

/**
 * A bot that mirrors threads across services.
 */
export class SyncBot extends ProcBot {
	/**
	 * Find, from the environment, a possible solution to the provided error message.
	 * @param service         Name of the service reporting the error.
	 * @param message         Message that the service reported.
	 * @param solutionMatrix  Possible solutions
	 * @returns               A suggested fix to the error.
	 */
	public static getErrorSolution(service: string, message: string, solutionMatrix: SolutionMatrix): SolutionIdea {
		try {
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
	 * Provide a method that:
	 *  * Encloses details available in advance.
	 *  * Reacts to details provided by each event.
	 * @param from                 Definition, {service, flow}, of the flow being listened to.
	 * @param to                   Definition {service, flow} of the flow being emitted to.
	 * @param messenger            Service to use to interact with the cloud.
	 * @param logger               Logger to use to interact with the maintainers.
	 * @param actions              An array of which actions to sync along this route.
	 * @param name                 Username that the router should use.
	 * @param aliases              List of usernames that the router should alias.
	 * @param solutionMatrix       A matrix of possible solutions to common routing errors.
	 * @param genericErrorMessage  An error message that should be used by default.
	 * @param archiveStrings       An array of strings that instruct the router to archive.
	 * @returns                    Function that processes events from the messenger.
	 */
	private static makeRouter(
		from: FlowDefinition,
		to: FlowDefinition,
		messenger: MessengerService,
		logger: Logger,
		actions: MessengerAction[],
		name: string,
		aliases: string[] = [],
		solutionMatrix?: SolutionMatrix,
		genericErrorMessage?: string,
		archiveStrings?: string[],
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
				logger.log(LogLevel.DEBUG, `---> Actioning '${firstLine}' to ${toText}.`);
				try {
					// This allows syncbot to represent specific other accounts.
					if (_.includes(_.map(aliases, _.toLower), data.details.handle.toLowerCase())) {
						data.details.handle = name;
						data.source.username = name;
					}
				} catch (error) {
					logger.log(LogLevel.WARN, 'Misconfiguration in SyncBot aliases.');
				}
				// Find details of any connections stored in the originating thread.
				return SyncBot.readConnectedThread(to, messenger, data, name)
				// Then comment on or create a thread, if appropriate.
				.then((threadDetails: MessengerEmitResponse) => {
					// If the search resolved with a response.
					const threadId = _.get(threadDetails, ['response', 'thread'], false);
					const flowId = _.get(threadDetails, ['response', 'flow'], true);
					if (threadId && (flowId === true || flowId === to.flow) && _.includes(actions, MessengerAction.CreateMessage)) {
						logger.log(LogLevel.INFO, `---> Creating comment '${firstLine}' on ${toText}.`);
						// Comment on the found thread
						const flow = { service: to.service, flow: to.flow, thread: threadId };
						return SyncBot.processCommand(flow, messenger, data, MessengerAction.CreateMessage)
						// Pass through details of the thread updated
						.then((emitResponse) => {
							if (emitResponse.err) {
								return emitResponse;
							}
							return {
								response: threadDetails.response,
								source: emitResponse.source,
							};
						});
					}
					if (!threadId && _.includes(actions, MessengerAction.CreateThread)) {
						logger.log(LogLevel.INFO, `---> Creating thread '${firstLine}' on ${toText}.`);
						// Create a thread if the quest for connections didn't find any
						return SyncBot.createThreadAndConnect(to, messenger, data, name);
					}
					// Pass on that this has no connected thread
					return {
						response: {},
						source: to.service,
					};
				})
				// Then report that we have passed the message on
				.then((response: MessengerEmitResponse) => {
					if (response.err) {
						logger.log(LogLevel.WARN, JSON.stringify({
							// Details of the message and the response
							data, response,
							// These are a couple of properties that do not always survive the stringify
							message: response.err.message, stack: response.err.stack,
						}));
						return SyncBot.createErrorComment(
							to, messenger, data, response.err, name, solutionMatrix, genericErrorMessage
						)
						.return(response);
					} else {
						logger.log(LogLevel.DEBUG, `---> Emitted '${firstLine}' to ${toText}.`);
					}
					return response;
				})
				// Then update the tags, if relevant
				.then((response: MessengerEmitResponse) => {
					// If the process this far resolved with a response
					const threadId = _.get(response, ['response', 'thread'], false);
					const flowId = _.get(response, ['response', 'flow'], true);
					if (threadId && (flowId === true || flowId === to.flow) && _.includes(actions, MessengerAction.UpdateTags)) {
						// Request that the tags be updated
						const flow = { service: to.service, flow: to.flow, thread: threadId };
						return SyncBot.processCommand(flow, messenger, data, MessengerAction.UpdateTags)
						.return(response);
					}
					// The correct action was to do nothing, so pass the details along to the next thing
					return response;
				})
				// Then archive the thread, if relevant
				.then((threadDetails: MessengerEmitResponse) => {
					// Pull some details to calculate whether we should archive
					const threadId = _.get(threadDetails, ['response', 'thread'], false);
					const flowId = _.get(threadDetails, ['response', 'flow'], true);
					const routeArchive = _.includes(actions, MessengerAction.ArchiveThread);
					const archiveRegex = archiveStrings ? new RegExp(`(${archiveStrings.join('|')})`, 'i') : null;
					const toldToArchive = archiveRegex && archiveRegex.test(data.details.text);
					if (threadId && (flowId === true || flowId === to.flow) && data.details.hidden && toldToArchive && routeArchive) {
						// Pass the instruction to archive to the static method
						const flow = { service: to.service, flow: to.flow, thread: threadId };
						return SyncBot.processCommand(flow, messenger, data, MessengerAction.ArchiveThread)
						.then((response: MessengerEmitResponse) => {
							const error = response.err;
							if (!error) {
								// If the service performed the action fine then report this
								logger.log(LogLevel.INFO, `---> Archived thread on ${toText} based on comment '${firstLine}'.`);
								return threadDetails;
							} else if (error instanceof TranslatorError && error.code === TranslatorErrorCode.EmitUnsupported) {
								// If the service does not support the action then do not panic
								return threadDetails;
							} else {
								return response;
							}
						});
					}
					// The correct action was to do nothing, so pass the details along to the next thing
					return threadDetails;
				})
				// We've got no more actions to perform, but ProcBot only expects promise resolution, no actual payload
				// Explicitly bookending the promise chain enables each .then() above to be developed atomically
				.then((_threadDetails: MessengerEmitResponse) => {
					return;
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
	 * @param name       Handle to use for error reporting.
	 * @param matrix     A matrix of possible solutions
	 * @param generic    Optional, a generic error message.
	 * @returns          Promise that resolves to the response from creating the message.
	 */
	private static createErrorComment(
		to: FlowDefinition,
		messenger: MessengerService,
		data: BasicMessageInformation,
		error: Error,
		name: string,
		matrix: SolutionMatrix = {},
		generic?: string,
	): Promise<MessengerEmitResponse> {
		const solution = SyncBot.getErrorSolution(to.service, error.message, matrix);
		const fixes = solution.fixes.length > 0 ?
			` * ${solution.fixes.join('\r\n * ')}` :
			generic || 'No fixes documented.';
		const echoData: BasicMessageInformation = {
			details: {
				genesis: to.service,
				handle: name,
				hidden: true,
				tags: data.details.tags,
				text: `${to.service} reports \`${solution.description}\`.\r\n${fixes}\r\n`,
				title: data.details.title,
			},
			source: {
				message: 'duff',
				thread: 'duff',
				service: to.service,
				username: name,
				flow: to.flow,
			},
		};
		return SyncBot.processCommand(data.source, messenger, echoData, MessengerAction.CreateMessage);
	}

	/**
	 * Pass to the messenger a request to perform a simple command.
	 * @param  to         Definition {service, flow, thread} of the thread being emitted to.
	 * @param  messenger  Service to use to interact with the cloud.
	 * @param  data       Event that is being processed.
	 * @param action      Action to perform.
	 * @returns           Promise to create the comment and respond with the threadId updated.
	 */
	private static processCommand(
		to: ThreadDefinition, messenger: MessengerService, data: BasicMessageInformation, action: MessengerAction
	): Promise<MessengerEmitResponse> {
		const transmit: TransmitInformation = {
			action,
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
				messenger: transmit,
			},
			source: 'syncbot',
		});
	}

	/**
	 * Pass to the messenger a request to find a connected thread.
	 * @param  to         Definition {service, flow, thread} of the thread being emitted to.
	 * @param  messenger  Service to use to interact with the cloud.
	 * @param  data       Event that is being processed.
	 * @param username    Username under which to request the data.
	 * @returns           Promise to create the comment and respond with the threadId updated.
	 */
	private static readConnectedThread(
		to: FlowDefinition, messenger: MessengerService, data: BasicMessageInformation, username: string,
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
				username,
			},
			// This feels paradoxical because the target of the read request ...
			// is the place the event came from.
			target: {
				flow: data.source.flow,
				service: data.source.service,
				thread: data.source.thread,
				username,
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
	 * @param name        Username under which to create the connection message.
	 * @returns           Promise to create the thread and respond with the threadId.
	 */
	private static createThreadAndConnect(
		to: FlowDefinition, messenger: MessengerService, data: BasicMessageInformation, name: string,
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
						handle: name,
						hidden: true,
						tags: data.details.tags,
						text: 'This is mirrored in ', // will be appended
						title: data.details.title,
					},
					// this message is being created from nothing.
					source: {
						message: 'duff',
						thread: 'duff', // will be replaced
						flow: 'duff', // will be replaced
						service: 'duff', // will be replaced
						username: 'duff',
					},
					target: {
						flow: 'duff', // will be replaced
						service: 'duff', // will be replaced
						// This is happening using SyncBot's credentials.
						username: name,
						thread: 'duff' // will be replaced
					}
				};

				// Clone and mutate the generic payload for emitting to the originating thread.
				const updateOriginating = _.cloneDeep(genericConnect);
				// This should update the thread that this process sourced from.
				updateOriginating.target = {
					flow: data.source.flow,
					service: data.source.service,
					username: name,
					thread: data.source.thread,
				};
				// This comments on the original thread about the new thread.
				updateOriginating.details.text += `[${createThread.target.service} thread ${response.thread}](${response.url})`;
				updateOriginating.details.genesis = createThread.target.service;
				updateOriginating.source.service = createThread.target.service;
				updateOriginating.source.thread = response.thread;
				updateOriginating.source.flow = createThread.target.flow;

				// Clone and mutate the generic payload for emitting to the created thread.
				const updateCreated = _.cloneDeep(genericConnect);
				// This should update the thread that this process created.
				updateCreated.target = {
					flow: createThread.target.flow,
					service: createThread.target.service,
					username: name,
					thread: response.thread,
				};
				// This comments on the new thread about the original thread..
				updateCreated.details.text += `[${data.source.service} thread ${data.source.thread}](${data.source.url})`;
				updateCreated.details.genesis = data.source.service;
				updateCreated.source.service = data.source.service;
				updateCreated.source.thread = data.source.thread;
				updateCreated.source.flow = data.source.flow;

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
	private static makeMessenger(
		listenerConstructors: MessengerConnectionDetails, port: number, metadataConfig: MetadataConfiguration, logger: Logger
	): MessengerService {
		// Created this as its own function to scope the `let` a little
		const messenger = new MessengerService({
			metadataConfig,
			server: port,
			subServices: listenerConstructors,
			type: ServiceType.Listener,
		}, logger);

		if (messenger) {
			return messenger;
		}
		throw new Error('Could not create Messenger.');
	}

	constructor(name = 'SyncBot') {
		super(name);

		super.retrieveConfiguration({
			emitter: 'string',
			location: process.env.SYNCBOT_CONFIG_TO_LOAD,
		}).then((rawConfig) => {
			if (rawConfig) {
				const config = ProcBot.injectEnvironmentVariables(rawConfig) as SyncBotConstructor;
				// Calculate secret to redact, with a couple that are specifically allowed through
				const secrets = ProcBot.determineInjections(rawConfig);
				delete secrets.SYNCBOT_PORT;
				delete secrets.SYNCBOT_NAME;
				this.logger.secrets = _.values(secrets);
				this.logger.log(LogLevel.INFO, `---> SyncBot configured to use port '${config.SYNCBOT_PORT}'.`);
				this.logger.log(LogLevel.INFO, `---> SyncBot configured to use name '${config.SYNCBOT_NAME}'.`);
				const port = parseInt(config.SYNCBOT_PORT, 10);
				const messenger = SyncBot.makeMessenger(
					config.SYNCBOT_LISTENER_CONSTRUCTORS, port, config.SYNCBOT_METADATA_CONFIG, this.logger
				);
				const mappings = config.SYNCBOT_MAPPINGS;
				const edgesMade = {};
				_.forEach(mappings, (mapping) => {
					const source = mapping.source;
					const destination = mapping.destination;
					// Register a mirroring from the first of the pair, to the second.
					const actions = [
						MessengerAction.CreateMessage,
						MessengerAction.CreateThread,
						MessengerAction.ArchiveThread,
						MessengerAction.UpdateTags,
					];
					const router = SyncBot.makeRouter(
						source,
						destination,
						messenger,
						this.logger,
						actions,
						config.SYNCBOT_NAME,
						config.SYNCBOT_ALIAS_USERS,
						config.SYNCBOT_ERROR_SOLUTIONS,
						config.SYNCBOT_ERROR_UNDOCUMENTED,
						config.SYNCBOT_ARCHIVE_STRINGS
					);
					const label = `${source.service}.${source.flow}(all)=>${destination.service}.${destination.flow}`;
					messenger.registerEvent({
						events: ['message'],
						listenerMethod: router,
						name: label,
					});
					const path = [source.service, source.flow, destination.service, destination.flow];
					_.set(edgesMade, path, true);
				});
				_.forEach(mappings, (mapping) => {
					// Create the reverse links for just messages and tags
					const source = mapping.destination;
					const destination = mapping.source;
					const path = [source.service, source.flow, destination.service, destination.flow];
					if (!_.get(edgesMade, path, false)) {
						const router = SyncBot.makeRouter(
							source,
							destination,
							messenger,
							this.logger,
							[MessengerAction.CreateMessage, MessengerAction.ArchiveThread, MessengerAction.UpdateTags],
							config.SYNCBOT_NAME,
							config.SYNCBOT_ALIAS_USERS,
							config.SYNCBOT_ERROR_SOLUTIONS,
							config.SYNCBOT_ERROR_UNDOCUMENTED,
							config.SYNCBOT_ARCHIVE_STRINGS
						);
						const label = `${source.service}.${source.flow}(messages)=>${destination.service}.${destination.flow}`;
						messenger.registerEvent({
							events: ['message'],
							listenerMethod: router,
							name: label,
						});
					}
				});
			} else {
				this.logger.log(LogLevel.WARN, "Couldn't load configuration.");
			}
		});
	}
}

export function createBot(): SyncBot {
	return new SyncBot();
}
