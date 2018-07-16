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
import {
	IssuesCreateCommentParams,
	IssuesGetCommentsParams,
} from 'github';
import * as _ from 'lodash';
import {
	GithubConstructor,
	GithubListenerConstructor,
} from '../../github-types';
import {
	BasicMessageInformation,
	EmitInstructions,
	MessengerAction,
	MessengerBaseIds,
	MessengerConstructor,
	MessengerEvent,
	SourceDescription,
	TransmitInformation,
	UpdateThreadResponse,
} from '../../messenger-types';
import {
	ServiceScaffoldEvent,
} from '../../service-scaffold-types';
import {
	ServiceEvent,
	ServiceType,
} from '../../service-types';
import {
	Translator,
	TranslatorError,
} from './translator';
import {
	MetadataEncoding,
	TranslatorScaffold,
} from './translator-scaffold';
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
export class GithubTranslator extends TranslatorScaffold implements Translator {
	/**
	 * Translations from GitHub target types into a singular form that can be used in a sentence.
	 * e.g. the 'issue' in 'issue closed'.
	 */
	private static typeTranslations = {
		issues: 'issue',
		pull_request: 'pull request',
	};

	/**
	 * Events on GitHub that may be used as a comment, rather than as their event description.
	 */
	private static commentTypes = ['issue opened', 'issue_comment created', 'pull request opened'];

	/**
	 * Convert a set of IDs from Messenger format to GitHub format.
	 * @param ids  IDs in the form { flow, thread }
	 * @returns    IDs in the form { owner, repo, number }
	 */
	private static splitIds(ids: MessengerBaseIds): { owner: string, repo: string, number?: number } {
		const splitFlow = ids.flow.split('/');
		const thread = ids.thread ? parseInt(ids.thread, 10) : undefined;
		return {
			owner: splitFlow[0],
			repo: splitFlow[1],
			number: thread,
		};
	}

	/**
	 * Converts a provided message object into instructions to read a thread.
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static searchThreadIntoEmit(message: TransmitInformation): Promise<EmitInstructions> {
		const splitIds = GithubTranslator.splitIds(message.target);
		const thread = splitIds.number;
		if (!thread) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot search for connections without a thread.'
			));
		}
		// The messenger, upstream of this, will bind the specified method and put it through emitter.sendData
		const payload: IssuesGetCommentsParams = _.merge({ per_page: 100, number: thread }, splitIds);
		return Promise.resolve({
			method: ['issues', 'getComments'],
			payload,
		});
	}

	/**
	 * Converts a provided message object into instructions to create a message.
	 * @param metadataConfig     Configuration of how to encode the metadata.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static createMessageIntoEmit(
		metadataConfig: MetadataConfiguration, message: TransmitInformation
	): Promise<EmitInstructions> {
		const splitIds = GithubTranslator.splitIds(message.target);
		const thread = splitIds.number;
		if (!thread) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a message without a thread.'
			));
		}
		if (message.details.hidden === true) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.EmitUnsupported, 'GitHub does not support whispers.'
			));
		}
		const metadataString = TranslatorScaffold.stringifyMetadata(message, MetadataEncoding.HiddenMD, metadataConfig);
		const body = `${message.details.handle}:\n${message.details.text}\n${metadataString}`;
		const payload: IssuesCreateCommentParams = _.merge({ body, number: thread }, splitIds);
		return Promise.resolve({
			method: ['issues', 'createComment'],
			payload,
		});
	}

	/**
	 * Converts a response into a the generic format.
	 * @param metadataConfig  Configuration of how the metadata was encoded.
	 * @param message         The initial message that triggered this response.
	 * @param response        The response provided by the service.
	 * @returns               Promise that resolves to the metadata of the connection.
	 */
	private static convertReadConnectionResponse(
		metadataConfig: MetadataConfiguration, message: BasicMessageInformation, response: any[]
	): Promise<SourceDescription> {
		return Promise.resolve(TranslatorScaffold.extractSource(
			message.current,
			_.map(response, (comment) => { return _.get(comment, 'body'); }),
			metadataConfig,
			MetadataEncoding.HiddenMD,
		));
	}

	/**
	 * Converts a response into a the generic format.
	 * @param _message  The initial message that triggered this response.
	 * @param response  The response provided by the service.
	 * @returns         Promise that resolves to the metadata of the connection.
	 */
	private static convertReadErrorResponse(
		_message: TransmitInformation, response: any[]
	): Promise<String[]> {
		return Promise.resolve(_.map(response, (comment) => comment.body));
	}

	/**
	 * Converts a thread update response into a promise that it is complete.
	 * @param _message   Not used, the initial message.
	 * @param _response  Not used, the response provided by the service.
	 * @returns          Promise that resolves once the update has occurred.
	 */
	private static convertUpdateThreadResponse(
		_message: TransmitInformation, _response: any
	): Promise<UpdateThreadResponse> {
		return Promise.resolve({});
	}

	public sharedEmitter = true;

	/**
	 * A list of Messenger events and their GitHub equivalents.
	 */
	protected eventEquivalencies = {
		message: ['issue_comment', 'issues', 'pull_request'],
	};
	/**
	 * A list of the converters that may be used to convert Messenger events into GitHub instructions.
	 */
	protected emitConverters: EmitConverters = {
		[MessengerAction.ReadConnection]: GithubTranslator.searchThreadIntoEmit,
		[MessengerAction.ReadErrors]: GithubTranslator.searchThreadIntoEmit,
	};
	/**
	 * A list of the converters that may be used to convert GitHub's responses into Messenger format.
	 */
	protected responseConverters: ResponseConverters = {
		[MessengerAction.CreateMessage]: GithubTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateConnection]: GithubTranslator.convertUpdateThreadResponse,
		[MessengerAction.ReadErrors]: GithubTranslator.convertReadErrorResponse,
	};
	/**
	 * Just a store of the details used to connect to GitHub.
	 */
	protected connectionDetails: GithubConstructor;

	constructor(data: GithubConstructor, metadataConfig: MetadataConfiguration) {
		super(metadataConfig);
		this.connectionDetails = data;
		this.responseConverters[MessengerAction.ReadConnection] =
			_.partial(GithubTranslator.convertReadConnectionResponse, metadataConfig);
		this.emitConverters[MessengerAction.CreateMessage] =
			_.partial(GithubTranslator.createMessageIntoEmit, metadataConfig);
		this.emitConverters[MessengerAction.CreateConnection] =
			_.partial(GithubTranslator.createMessageIntoEmit, metadataConfig);
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to an array of message objects in the standard form
	 */
	public eventIntoMessages(event: ServiceScaffoldEvent): Promise<MessengerEvent[]> {
		const eventFilter = {
			issues: [ 'reopened', 'opened', 'closed' ],
			issue_comment: [ 'created' ],
			pull_request: [ 'reopened', 'opened', 'closed' ],
		};
		const actions = _.get(eventFilter, event.cookedEvent.type, []);
		if (!_.includes(actions, event.cookedEvent.data.action)) {
			return Promise.resolve([]);
		}
		const data = event.cookedEvent.data;
		const comment = data.comment || data.issue || data.pull_request;
		const thread = data.issue || data.pull_request;
		const metadata = TranslatorScaffold.extractMetadata(
			comment.body, MetadataEncoding.HiddenMD, this.metadataConfig
		);
		const friendlyType = _.get(GithubTranslator.typeTranslations, event.cookedEvent.type, event.cookedEvent.type);
		const action = `${friendlyType} ${event.cookedEvent.data.action}`;
		const text = _.includes(GithubTranslator.commentTypes, action) ? metadata.content : `\`${action}\``;
		const result: MessengerEvent = {
			context: `${event.source}.${thread.id}`,
			cookedEvent: {
				details: {
					handle: data.sender.login,
					hidden: _.isSet(metadata.hidden) ? metadata.hidden : false,
					tags: thread.labels,
					text: TranslatorScaffold.unixifyNewLines(text),
					time: event.cookedEvent.data.updated_at,
					title: thread.title
				},
				current: {
					flow: data.repository.full_name,
					message: comment.id,
					service: event.source,
					thread: thread.number,
					url: thread.html_url,
					username: data.sender.login
				},
				source: {
					service: metadata.service || event.source,
					flow: metadata.flow || event.cookedEvent.flow,
					thread: metadata.thread || thread.number,
					message: comment.id,
					url: thread.html_url,
					username: data.sender.login,
				}
			},
			rawEvent: event.rawEvent,
			source: `${event.source}.translated`,
			type: this.eventIntoMessageType(event),
		};
		return Promise.resolve([result]);
	}

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param _message  Message information, not used.
	 * @returns         The details required to construct an emitter.
	 */
	public messageIntoEmitterConstructor(_message: TransmitInformation): GithubConstructor {
		return {
			client: this.connectionDetails.client,
			authentication: this.connectionDetails.authentication,
			type: ServiceType.Emitter
		};
	}

	/**
	 * Populate the listener constructor with details from the more generic constructor.
	 * Provided since the connectionDetails might need to come from a mix of parsed and instantiated sources.
	 * @param connectionDetails  Construction details for the service, probably 'inert', ie from JSON.
	 * @param genericDetails     Details from the messenger construction, might be 'live', ie have an express instance.
	 * @returns                  Connection details with the value merged in.
	 */
	public mergeGenericDetails(
		connectionDetails: GithubListenerConstructor, genericDetails: MessengerConstructor
	): GithubListenerConstructor {
		if (genericDetails.ingress === undefined && connectionDetails.ingress === undefined) {
			throw new Error('To instantiate a Github listener you must provide a server.');
		}
		if (connectionDetails.ingress === undefined && genericDetails.ingress !== undefined) {
			connectionDetails.ingress = genericDetails.ingress;
		}
		if (connectionDetails.type === undefined) {
			connectionDetails.type = genericDetails.type;
		}
		return connectionDetails;
	}

	/**
	 * Find the generic name for a provided event.
	 * @param event  Event to analyse.
	 * @returns      Generic name for the event.
	 */
	public eventIntoMessageType(event: ServiceEvent): string {
		return _.findKey(this.eventEquivalencies, (value: string[]) => {
			return _.includes(value, event.cookedEvent.type);
		}) || 'Unrecognised event';
	}
}

/**
 * Builds a translator that will convert specific information to and from Messenger format.
 * @param data            Construction details for creating a session.
 * @param metadataConfig  Configuration of how to encode metadata.
 * @returns               A translator, ready to interpret specific communications.
 */
export function createTranslator(data: GithubConstructor, metadataConfig: MetadataConfiguration): Translator {
	return new GithubTranslator(data, metadataConfig);
}
