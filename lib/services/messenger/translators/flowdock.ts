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
import {
	FlowdockConstructor,
	FlowdockEmitInstructions,
	FlowdockEvent,
	FlowdockMessage,
	FlowdockResponse,
} from '../../flowdock-types';
import {
	BasicMessageInformation,
	CreateThreadResponse,
	MessengerAction,
	MessengerConstructor,
	MessengerEvent,
	SourceDescription,
	TransmitInformation,
	UpdateThreadResponse,
} from '../../messenger-types';
import { ServiceType } from '../../service-types';
import { Translator, TranslatorError } from './translator';
import { MetadataEncoding, TranslatorScaffold } from './translator-scaffold';
import {
	EmitConverters,
	MetadataConfiguration,
	ResponseConverters,
	TranslatorErrorCode,
	TranslatorMetadata,
} from './translator-types';

/**
 * Class to enable the translating between messenger standard forms and service
 * specific forms.
 */
export class FlowdockTranslator extends TranslatorScaffold implements Translator {
	/**
	 * Given a basic string this will extract a more rich context for the event, if embedded.
	 * @param message  Basic string that may contain metadata.
	 * @param format   Format of the metadata encoding.
	 * @param config   Configuration that may have used to encode metadata.
	 * @returns        Object of content, genesis and hidden.
	 */
	public static extractMetadata(
		message: string, format: MetadataEncoding, config: MetadataConfiguration,
	): TranslatorMetadata {
		const superFormat = (format === MetadataEncoding.Flowdock) ? MetadataEncoding.HiddenMD : format;
		const metadata = TranslatorScaffold.extractMetadata(message, superFormat, config);
		const findPublic = '^> *';
		if ((format === MetadataEncoding.Flowdock) && (metadata.service === null)) {
			// Check for magic syntax if the message originated in Flowdock
			metadata.hidden = !(new RegExp(findPublic, 'i').test(message));
		}
		if (metadata.hidden === false) {
			// Tidy any magic syntax from public messages
			metadata.content = metadata.content.replace(new RegExp(findPublic, 'igm'), '').trim();
		}
		return metadata;
	}

	/**
	 * Encode the metadata of an event into a string to embed in the message.
	 * @param data    Event to gather details from.
	 * @param format  Optional, markdown or plaintext, defaults to markdown.
	 * @param config  Configuration that should be used to encode the metadata.
	 * @returns       Text with data embedded.
	 */
	public static stringifyMetadata(
		data: BasicMessageInformation, format: MetadataEncoding, config: MetadataConfiguration,
	): string {
		const superFormat = (format === MetadataEncoding.Flowdock) ? MetadataEncoding.HiddenMD : format;
		return TranslatorScaffold.stringifyMetadata(data, superFormat, config);
	}

	/**
	 * Extract the thread id for the referenced service from an array of messages.
	 * @param service   Service of interest.
	 * @param messages  Message to search.
	 * @param config      Configuration that may have been used to encode metadata.
	 * @param format    Format used to encode the metadata.
	 */
	public static extractSource(
		service: string,
		messages: string[],
		config: MetadataConfiguration,
		format?: MetadataEncoding,
	): SourceDescription {
		const superFormat = (format === MetadataEncoding.Flowdock) ? MetadataEncoding.HiddenMD : format;
		return TranslatorScaffold.extractSource(service, messages, config, superFormat);
	}

	/**
	 * Convert an array of tags into a single hash-tagged string.
	 * @param tags  Array of strings to hashtag and join.
	 * @returns     String of joined hashtags.
	 */
	public static makeTagString(tags: string[]): string {
		const hashAddedTags = _.map(tags, (tag) => {
			return `#${tag}`;
		});
		return hashAddedTags.join(' ');
	}

	/**
	 * Internal function to create a formatted and length limited text block for a message.
	 * @param body     Body of the message, this part may end up snipped.
	 * @param options  Other parts of the message and guides as to formatting.
	 *                   may contain header, metadata, footer, tags and linePrefix.
	 * @returns         Markdown formatted text block within Flowdock's character limit.
	 */
	public static createFormattedText(
		body: string,
		options: {
			header?: string;
			metadata?: string;
			footer?: string;
			tags?: string[];
			linePrefix?: string;
			lengthLimit?: number;
		} = {},
	): string {
		const lengthLimit = (options && options.lengthLimit) || 8096;
		const prefix = options.linePrefix || '';
		const first = options.header ? `${options.header}\n--\n` : '';
		const second = options.tags ? `${FlowdockTranslator.makeTagString(options.tags)}\n` : '';
		const prefixedBody = body.replace(/^/gmi, prefix);
		const penultimate = options.footer ? `\n${options.footer}` : '';
		const last = options.metadata ? `\n${options.metadata}` : '';
		const candidate = `${first}${second}${prefixedBody}${penultimate}${last}`;
		if (candidate.length < lengthLimit) {
			return candidate;
		}
		const snipProvisional = '\n`… about xx% shown.`';
		const midSpace = lengthLimit - `${first}${second}${snipProvisional}${penultimate}${last}`.length;
		const snipped = prefixedBody.substr(0, midSpace);
		const roundedSnip = Math.floor((100*snipped.length)/body.length);
		const snipText = snipProvisional.replace('xx', roundedSnip.toString(10));
		return `${first}${second}${snipped}${snipText}${penultimate}${last}`;
	}

	/**
	 * Utility function to structure the flowdock session as a promise.
	 * @param session  Session to interrogate
	 * @param path     Endpoint to retrieve.
	 * @param search   Optional, some words which may be used to shortlist the results.
	 * @returns        Response from the session.
	 */
	protected static fetchFromSession = (session: Session, path: string, search?: string): Promise<any> => {
		return new Promise<any>((resolve, reject) => {
			session.get(path, {search}, (error?: Error, result?: any) => {
				if (result) {
					resolve(result);
				} else {
					reject(error);
				}
			});
		});
	}

	/**
	 * Converts a response into the generic format.
	 * @param message   The initial message that prompted this action.
	 * @param response  The response from the SDK.
	 * @returns         Promise that resolve to the thread details.
	 */
	private static convertCreateThreadResponse(
		message: TransmitInformation, response: FlowdockResponse
	): Promise<CreateThreadResponse> {
		const thread = response.thread_id;
		const url = `https://www.flowdock.com/app/${message.target.flow}/threads/${thread}`;
		return Promise.resolve({
			thread: response.thread_id,
			url,
		});
	}

	/**
	 * Converts a response into the generic format.
	 * @param metadataConfig  Configuration of how metadata was encoded
	 * @param message         The initial message that prompted this action.
	 * @param response        The response from the SDK.
	 * @returns               Promise that resolve to the thread details.
	 */
	private static convertReadConnectionResponse(
		metadataConfig: MetadataConfiguration, message: TransmitInformation, response: FlowdockMessage[]
	): Promise<SourceDescription> {
		return Promise.resolve(FlowdockTranslator.extractSource(
			message.source.service,
			_.map(response, (comment) => { return comment.content; }),
			metadataConfig,
			MetadataEncoding.Flowdock,
		));
	}

	/**
	 * Converts a response into the generic format.
	 * @param _message   The initial message that prompted this action.
	 * @param _response  The response from the SDK.
	 * @returns          Promise that resolve to the thread details.
	 */
	private static convertUpdateThreadResponse(
		_message: TransmitInformation, _response: FlowdockResponse
	): Promise<UpdateThreadResponse> {
		return Promise.resolve({});
	}

	/**
	 * Converts a provided message object into instructions to create a thread.
	 * @param metadataConfig  Configuration of how to encode metadata
	 * @param message         object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createThreadIntoEmit(
		metadataConfig: MetadataConfiguration,
		message: TransmitInformation
	): Promise<FlowdockEmitInstructions> {
		// Check we have a flow.
		if (!message.details.title) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a thread without a title'
			));
		}
		// Bundle for the session
		return Promise.resolve({
			method: ['post'],
			payload: {
				path: `/flows/${message.target.flow}/messages`,
				payload: {
					// The concatenated string, of various data nuggets, to emit.
					content: FlowdockTranslator.createFormattedText(
						message.details.text,
						{
							header: message.details.title,
							metadata: FlowdockTranslator.stringifyMetadata(message, MetadataEncoding.Flowdock, metadataConfig),
							linePrefix: '>',
						}
					),
					event: 'message',
					external_user_name: message.details.handle.replace(/\s/g, '_')
				}
			}
		});
	}

	/**
	 * Converts a provided message object into instructions to create a message.
	 * @param metadataConfig  Configuration of how to encode metadata.
	 * @param message         object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createMessageIntoEmit(
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
				path: `/flows/${message.target.flow}/threads/${threadId}/messages`,
				payload: {
					content: FlowdockTranslator.createFormattedText(
						message.details.text,
						{
							metadata: FlowdockTranslator.stringifyMetadata(message, MetadataEncoding.Flowdock, metadataConfig),
							linePrefix: message.details.hidden ? '' : '>',
						}
					),
					event: 'message',
					external_user_name: message.details.handle.replace(/\s/g, '_'),
				}
			}
		});
	}

	/**
	 * Converts a provided message object into instructions to update tags.
	 * @param session  Session to query to find the initial message of the thread.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static updateTagsIntoEmit(
		session: Session, message: TransmitInformation
	): Promise<FlowdockEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot update tags without a thread.'
			));
		}
		// Check we have tags.
		const tags = message.details.tags;
		if (!_.isArray(tags)) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot update tags without a tags array.'
			));
		}
		// Get the initial message.
		return FlowdockTranslator.fetchFromSession(session, `/flows/${message.target.flow}/threads/${threadId}`)
		.then((threadResponse) => {
			return FlowdockTranslator.fetchFromSession(
				session,
				`/flows/${message.target.flow}/messages/${threadResponse.initial_message}`,
			);
		})
		// Add the actual tags to the user mention tags
		.then((initialMessage) => {
			const systemTags = _.filter(initialMessage.tags, (tag: string) => {
				return /^:/.test(tag);
			});
			// Bundle for the session.
			return {
				method: ['put'],
				payload: {
					path: `/flows/${message.target.flow}/messages/${initialMessage.id}`,
					payload: {
						tags: _.concat(tags, systemTags)
					},
				}
			};
		});
	}

	/**
	 * Converts a provided message object into instructions to read a thread for connections.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static readConnectionIntoEmit(message: TransmitInformation): Promise<FlowdockEmitInstructions> {
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
				path: `/flows/${message.target.flow}/threads/${threadId}/messages`,
				payload: {
					limit: '100', // Default is 30, but there is literally no reason why we wouldn't ask for as many as we can
					search: `${message.source.service} thread`,
				},
			}
		});
	}

	protected eventEquivalencies = {
		message: ['message'],
	};
	protected emitConverters: EmitConverters = {
		[MessengerAction.ReadConnection]: FlowdockTranslator.readConnectionIntoEmit,
	};
	protected responseConverters: ResponseConverters = {
		[MessengerAction.UpdateTags]: FlowdockTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateMessage]: FlowdockTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateThread]: FlowdockTranslator.convertCreateThreadResponse,
	};
	protected session: Session;

	private token: string;

	constructor(data: FlowdockConstructor, metadataConfig: MetadataConfiguration) {
		super(metadataConfig);
		this.session = new Session(data.token);
		// The flowdock service both emits and calls back the error
		// We'll just log the emit to prevent it bubbling
		this.session.on('error', _.partial(console.log, 'Error in Flowdock translator.'));
		this.token = data.token;
		// These converters require the injection of a couple of details from `this` instance.
		this.responseConverters[MessengerAction.ReadConnection] =
			_.partial(FlowdockTranslator.convertReadConnectionResponse, metadataConfig);
		this.emitConverters[MessengerAction.CreateThread] =
			_.partial(FlowdockTranslator.createThreadIntoEmit, metadataConfig);
		this.emitConverters[MessengerAction.CreateMessage] =
			_.partial(FlowdockTranslator.createMessageIntoEmit, metadataConfig);
		this.emitConverters[MessengerAction.UpdateTags] =
			_.partial(FlowdockTranslator.updateTagsIntoEmit, this.session);
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to an array of message objects in the standard form
	 */
	public eventIntoMessages(event: FlowdockEvent): Promise<MessengerEvent[]> {
		const details = this.eventIntoMessageDetails(event);
		// Flowdock uses tags that begin with a colon as system tags.
		const tagFilter = (tag: string) => {
			return !/^:/.test(tag);
		};
		// Start building this in service scaffold form.
		const cookedEvent: BasicMessageInformation = {
			details: {
				service: details.message.metadata.service || details.ids.service,
				flow: details.message.metadata.flow || details.ids.flow,
				handle: 'duff_FlowdockTranslator_eventIntoMessage_a', // gets replaced
				hidden: details.message.metadata.hidden,
				tags: [], // gets replaced
				text: details.message.text,
				title: 'duff_FlowdockTranslator_eventIntoMessage_b', // gets replaced
			},
			source: {
				service: details.ids.service,
				message: event.rawEvent.id,
				flow: details.ids.flow,
				thread: details.ids.thread,
				url: details.paths.thread,
				username: 'duff_FlowdockTranslator_eventIntoMessage_c', // gets replaced
			},
		};
		// Get details of the tags and title from the first message.
		return FlowdockTranslator.fetchFromSession(this.session, details.paths.firstMessage)
		.then((firstMessage) => {
			const firstMessageEvent = _.merge(_.cloneDeep(event), { rawEvent: firstMessage });
			const firstMessageDetails = this.eventIntoMessageDetails(firstMessageEvent);
			cookedEvent.details.tags = _.uniq(firstMessage.tags.filter(tagFilter));
			cookedEvent.details.title = firstMessageDetails.message.title;
			return Promise.resolve(undefined);
		})
		// Get details of the user nickname.
		.then(() => this.fetchAlias(event))
		// Resolve to the details, compiled from those provided and those gathered.
		.then((username: string) => {
			cookedEvent.source.username = username;
			cookedEvent.details.handle = username;
			return [{
				context: `${event.source}.${event.context}`,
				type: this.eventIntoMessageType(event),
				cookedEvent,
				rawEvent: event.rawEvent,
				source: event.source,
			}];
		});
	}

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param _message  Message information, not used.
	 * @returns         The details required to construct an emitter.
	 */
	public messageIntoEmitterConstructor(_message: TransmitInformation): FlowdockConstructor {
		return {
			serviceName: 'flowdock',
			token: this.token,
			type: ServiceType.Emitter
		};
	}

	/**
	 * Populate the listener constructor with details from the more generic constructor.
	 * Provided since the connectionDetails might need to be parsed from JSON and the server details might be instantiated.
	 * @param connectionDetails  Construction details for the service, probably 'inert', ie from JSON.
	 * @param genericDetails     Details from the construction of the messenger.
	 * @returns                  Connection details with the value merged in.
	 */
	public mergeGenericDetails(
		connectionDetails: FlowdockConstructor, genericDetails: MessengerConstructor
	): FlowdockConstructor {
		if (connectionDetails.type === undefined) {
			connectionDetails.type = genericDetails.type;
		}
		return connectionDetails;
	}

	/**
	 * Promise to retrieve the alias used to present an event
	 * @param event  Event to scrutinise for user details
	 * @returns      Promise that resolves to the alias presented with the message
	 */
	protected fetchAlias(event: FlowdockEvent): Promise<string> {
		if (event.rawEvent.external_user_name) {
			return event.rawEvent.external_user_name;
		}
		const url = `/users/${event.rawEvent.user}`;
		return FlowdockTranslator.fetchFromSession(this.session, url)
		.get('nick');
	}

	/**
	 * Calculate some trivially derivable details from an event and this context.
	 * @param event  Event to analyse.
	 * @returns      Some cherry picked derivations of the event.
	 */
	protected eventIntoMessageDetails(event: FlowdockEvent) {
		// Calculate metadata and use whichever matched, i.e. has a shorter content because it extracted metadata.
		const metadata = FlowdockTranslator.extractMetadata(
			event.rawEvent.content, MetadataEncoding.Flowdock, this.metadataConfig
		);
		// Pull some details out of the event.
		// Any characters, then a newline, then markdown title formatting, then absolutely anything.
		const titleSplitter = /^(.*)[\r\n][\s-=]*([\s\S]+)$/;
		const titleAndText = metadata.content.match(titleSplitter);
		const text = titleAndText ? titleAndText[2].trim() : metadata.content.trim();
		const title = titleAndText ? titleAndText[1].trim() : metadata.content.trim();
		const flow = event.cookedEvent.flow;
		const threadId = event.rawEvent.thread_id;
		const user = event.rawEvent.user;
		const service = event.source;
		const message = event.rawEvent.id;
		const threadUrl = `https://www.flowdock.com/app/${flow}/threads/${threadId}`;
		const firstMessageId = event.rawEvent.thread.initial_message;
		const firstMessagePath = `flows/${flow}/messages/${firstMessageId}`;
		const messagesPath = `/flows/${flow}/threads/${threadId}/messages`;
		return {
			ids: {
				service,
				flow,
				thread: threadId,
				user,
				message,
				firstMessage: firstMessageId,
			},
			paths: {
				thread: threadUrl,
				firstMessage: firstMessagePath,
				messages: messagesPath,
			},
			message: {
				metadata,
				text,
				title,
			}
		};
	}
}

/**
 * Builds a translator that will convert Flowdock specific information to and from Messenger format.
 * @param data            Construction details for creating a Flowdock session.
 * @param metadataConfig  Configuration of how to encode metadata.
 * @returns               A translator, ready to interpret Flowdock's communications.
 */
export function createTranslator(data: FlowdockConstructor, metadataConfig: MetadataConfiguration): Translator {
	return new FlowdockTranslator(data, metadataConfig);
}
