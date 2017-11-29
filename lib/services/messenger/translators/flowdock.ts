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
} from './translator-types';

/**
 * Class to enable the translating between messenger standard forms and service
 * specific forms.
 */
export class FlowdockTranslator extends TranslatorScaffold implements Translator {
	/**
	 * Internal function to create a formatted and length limited text block for a message.
	 * @param body      Body of the message, this part may be snipped
	 * @param header    Header, if any, to put at the top of the message.
	 * @param metadata  Metadata string, if any, to inject at the beginning of the content.
	 * @param footer    Footer, if any, to put at the bottom of the message.
	 * @returns         Markdown formatted text block within Flowdock's character limit.
	 */
	public static createFormattedText(body: string, header?: string, metadata?: string, footer?: string): string {
		const lengthLimit = 8096;
		const first = header ? `${header}\n--\n` : '';
		const inject = metadata ? metadata : '';
		const last = footer ? `\n${footer}` : '';
		if ((first.length + inject.length + body.length + last.length) < lengthLimit) {
			return `${first}${body}${last}${inject}`;
		}
		const snipProvisional = '\n\n`... about xx% shown.`';
		const snipped = body.substr(0, lengthLimit - first.length - inject.length - snipProvisional.length - last.length);
		const snipText = snipProvisional.replace('xx', Math.floor((100*snipped.length)/body.length).toString(10));
		return `${first}${snipped}${snipText}${last}${inject}`;
	}

	/**
	 * Utility function to structure the flowdock session as a promise.
	 * @param session  Session to interrogate
	 * @param path     Endpoint to retrieve.
	 * @param search   Optional, some words which may be used to shortlist the results.
	 * @returns        Response from the session.
	 */
	private static fetchFromSession = (session: Session, path: string, search?: string): Promise<any> => {
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
	 * @param org       Parameterised name of the organization.
	 * @param message   The initial message that prompted this action.
	 * @param response  The response from the SDK.
	 * @returns         Promise that resolve to the thread details.
	 */
	private static convertCreateThreadResponse(
		org: string, message: TransmitInformation, response: FlowdockResponse
	): Promise<CreateThreadResponse> {
		const thread = response.thread_id;
		const flow = message.target.flow;
		const url = `https://www.flowdock.com/app/${org}/${flow}/threads/${thread}`;
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
		return Promise.resolve(TranslatorScaffold.extractSource(
			message.source.service,
			_.map(response, (comment) => { return comment.content; }),
			metadataConfig,
			MetadataEncoding.HiddenMD,
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
	 * @param orgId           Parameterised ID of the organisation.
	 * @param metadataConfig  Configuration of how to encode metadata
	 * @param message         object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createThreadIntoEmit(
		orgId: string,
		metadataConfig: MetadataConfiguration,
		message: TransmitInformation
	): Promise<FlowdockEmitInstructions> {
		// Check we have a flow.
		const flowId = message.target.flow;
		if (!message.details.title) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a thread without a title'
			));
		}
		// Bundle for the session
		return Promise.resolve({method: ['post'], payload: {
			path: `/flows/${orgId}/${flowId}/messages`,
			payload: {
				// The concatenated string, of various data nuggets, to emit.
				content: FlowdockTranslator.createFormattedText(
					message.details.text,
					message.details.title,
					TranslatorScaffold.stringifyMetadata(message, MetadataEncoding.HiddenMD, metadataConfig)
				),
				event: 'message',
				external_user_name: message.details.handle.replace(/\s/g, '_'),
			},
		}});
	}

	/**
	 * Converts a provided message object into instructions to create a message.
	 * @param orgId           Parameterised ID of the organisation.
	 * @param metadataConfig  Configuration of how to encode metadata.
	 * @param message         object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createMessageIntoEmit(
		orgId: string,
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
		return Promise.resolve({ method: ['post'], payload: {
			path: `/flows/${orgId}/${message.target.flow}/threads/${threadId}/messages`,
			payload: {
				content: FlowdockTranslator.createFormattedText(
					message.details.text,
					undefined,
					TranslatorScaffold.stringifyMetadata(message, MetadataEncoding.HiddenMD, metadataConfig)
				),
				event: 'message',
				external_user_name: message.details.handle.replace(/\s/g, '_'),
			}
		}});
	}

	/**
	 * Converts a provided message object into instructions to update tags.
	 * @param orgId    Parameterised ID of the organisation.
	 * @param session  Session to query to find the initial message of the thread.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static updateTagsIntoEmit(
		orgId: string, session: Session, message: TransmitInformation
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
		const flowId = message.target.flow;
		return FlowdockTranslator.fetchFromSession(session, `/flows/${orgId}/${flowId}/threads/${threadId}`)
		.then((threadResponse) => {
			return FlowdockTranslator.fetchFromSession(
				session,
				`/flows/${orgId}/${flowId}/messages/${threadResponse.initial_message}`,
			);
		})
		// Add the actual tags to the user mention tags
		.then((initialMessage) => {
			const systemTags = _.filter(initialMessage.tags, (tag: string) => {
				return /^:/.test(tag);
			});
			// Bundle for the session.
			return { method: ['put'], payload: {
				path: `/flows/${orgId}/${flowId}/messages/${initialMessage.id}`,
				payload: { tags: _.concat(tags, systemTags) },
			}};
		});
	}

	/**
	 * Converts a provided message object into instructions to read a thread for connections.
	 * @param orgId    Parameterised ID of the organisation.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static readConnectionIntoEmit(orgId: string, message: TransmitInformation): Promise<FlowdockEmitInstructions> {
		// Check we have a thread.
		const threadId = message.target.thread;
		if (!threadId) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot search for connections without a thread.'
			));
		}
		// Bundle for the session.
		return Promise.resolve({ method: ['get'], payload: {
			path: `/flows/${orgId}/${message.target.flow}/threads/${threadId}/messages`,
			payload: {
				limit: '100', // Default is 30, but there is literally no reason why we wouldn't ask for as many as we can
				search: `${message.source.service} thread`,
			},
		}});
	}

	protected eventEquivalencies = {
		message: ['message'],
	};
	protected emitConverters: EmitConverters = {};
	protected responseConverters: ResponseConverters = {
		[MessengerAction.UpdateTags]: FlowdockTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateMessage]: FlowdockTranslator.convertUpdateThreadResponse,
	};

	private token: string;
	private session: Session;
	private organization: string;

	constructor(data: FlowdockConstructor, metadataConfig: MetadataConfiguration) {
		super(metadataConfig);
		this.session = new Session(data.token);
		// The flowdock service both emits and calls back the error
		// We'll just log the emit to prevent it bubbling
		this.session.on('error', _.partial(console.log, 'Error in Flowdock translator.'));
		this.organization = data.organization;
		this.token = data.token;
		// These converters require the injection of a couple of details from `this` instance.
		this.responseConverters[MessengerAction.CreateThread] =
			_.partial(FlowdockTranslator.convertCreateThreadResponse, data.organization);
		this.responseConverters[MessengerAction.ReadConnection] =
			_.partial(FlowdockTranslator.convertReadConnectionResponse, metadataConfig);
		this.emitConverters[MessengerAction.CreateThread] =
			_.partial(FlowdockTranslator.createThreadIntoEmit, data.organization, metadataConfig);
		this.emitConverters[MessengerAction.CreateMessage] =
			_.partial(FlowdockTranslator.createMessageIntoEmit, data.organization, metadataConfig);
		this.emitConverters[MessengerAction.UpdateTags] =
			_.partial(FlowdockTranslator.updateTagsIntoEmit, data.organization, this.session);
		this.emitConverters[MessengerAction.ReadConnection] =
			_.partial(FlowdockTranslator.readConnectionIntoEmit, data.organization);
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to an array of message objects in the standard form
	 */
	public eventIntoMessages(event: FlowdockEvent): Promise<MessengerEvent[]> {
		// Calculate metadata and use whichever matched, i.e. has a shorter content because it extracted metadata.
		const MDMetadata = TranslatorScaffold.extractMetadata(
			event.rawEvent.content, MetadataEncoding.HiddenMD, this.metadataConfig
		);
		const charMetadata = TranslatorScaffold.extractMetadata(
			event.rawEvent.content, MetadataEncoding.Character, this.metadataConfig
		);
		const metadata = MDMetadata.content.length < charMetadata.content.length ? MDMetadata : charMetadata;
		// Pull some details out of the event.
		const titleSplitter = /^(.*)\n--\n((?:\r|\n|.)*)$/;
		const titleAndText = metadata.content.match(titleSplitter);
		const text = titleAndText ? titleAndText[2].trim() : metadata.content.trim();
		const flow = event.cookedEvent.flow;
		const thread = event.rawEvent.thread_id;
		const userId = event.rawEvent.user;
		const org = this.organization;
		const firstMessageId = event.rawEvent.thread.initial_message;
		// Flowdock uses tags that begin with a colon as system tags.
		const tagFilter = (tag: string) => {
			return !/^:/.test(tag);
		};
		// Start building this in service scaffold form.
		const cookedEvent: BasicMessageInformation = {
			details: {
				genesis: metadata.genesis || event.source,
				handle: 'duff', // gets replaced
				hidden: metadata.hidden,
				tags: [], // gets replaced
				text,
				title: 'duff', // gets replaces
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
		// Get details of the tags and title from the first message.
		return FlowdockTranslator.fetchFromSession(this.session, `flows/${org}/${flow}/messages/${firstMessageId}`)
		.then((firstMessage) => {
			cookedEvent.details.tags = _.uniq(firstMessage.tags.filter(tagFilter));
			const findTitle = firstMessage.content.match(titleSplitter);
			cookedEvent.details.title = findTitle ? findTitle[1].trim() : firstMessage.content;
			return Promise.resolve(undefined);
		})
		// Get details of the user nickname.
		.then(() => {
			if (event.rawEvent.external_user_name) {
				return event.rawEvent.external_user_name;
			}
			return FlowdockTranslator.fetchFromSession(this.session, `/organizations/${org}/users/${userId}`)
			.then((user) => {
				return user.nick;
			});
		})
		// Resolve to the details, compiled from those provided and those gathered.
		.then((username: string) => {
			cookedEvent.source.username = username;
			cookedEvent.details.handle = username;
			return [{
				context: `${event.source}.${event.cookedEvent.context}`,
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
			organization: this.organization,
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
