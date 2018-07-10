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
import { Dictionary } from 'lodash';
import * as request from 'request-promise';
import {
	DiscourseConstructor,
	DiscourseEmitInstructions,
	DiscoursePostSearchResponse,
	DiscourseReceivedMessage,
	DiscourseResponse,
	DiscourseServiceEvent,
} from '../../discourse-types';
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
export class DiscourseTranslator extends TranslatorScaffold implements Translator {
	/**
	 * Converts a provided username, in Discourse format, into a generic username
	 * @param username  Username to convert
	 * @returns         Generic equivalent of that username
	 */
	public static convertUsernameToGeneric(username: string): string {
		// Generic has `-` at the end, Discourse has `_` at the beginning
		if (/^_/.test(username)) {
			return `${username.replace(/^_/, '')}-`;
		}
		return username;
	}

	/**
	 * Converts a provided username, in generic format, into a Discourse username
	 * @param username  Username to convert
	 * @returns         Discourse equivalent of that username
	 */
	public static convertUsernameToDiscourse(username: string): string {
		// Generic has `-` at the end, Discourse has `_` at the beginning
		if (/-$/.test(username)) {
			return `_${username.replace(/-$/, '')}`;
		}
		return username;
	}

	/**
	 * Undoes a few of the decisions that Discourse makes when receiving a POST
	 * @param comment  Comment to reverse engineer
	 * @returns        Best guess as to original comment
	 */
	public static reverseEngineerComment(comment: DiscourseReceivedMessage): string {
		// Because Discourse assumes that when my POST contains:
		// hyphen hyphen ("--") then what I mean is en dash ("–")
		// hyphen hyphen hyphen ("---") then what I mean in em dash ("—")
		return comment.cooked.replace(/–/g, '--').replace(/—/g, '---').replace(/&amp;/g, '&');
	}

	/**
	 * Converts provided message details into a Promise of emit instructions
	 * @param message         Message data to emit
	 * @param thread          Thread ID to emit to
	 * @param metadataConfig  Configuration of how to encode the metadata
	 * @returns               Promise that resolves to the instructions that will emit the message
	 */
	public static bundleMessage(
		message: BasicMessageInformation, thread: string, metadataConfig: MetadataConfiguration
	): Promise<DiscourseEmitInstructions> {
		const metadataString = TranslatorScaffold.stringifyMetadata(message, MetadataEncoding.HiddenMD, metadataConfig);
		const converter = DiscourseTranslator.convertUsernameToDiscourse;
		const messageString = TranslatorScaffold.convertPings(message.details.text, converter);
		return Promise.resolve({
			method: ['request'],
			payload: {
				htmlVerb: 'POST',
				path: '/posts',
				body: {
					raw: `${messageString}\n${metadataString}`,
					topic_id: thread,
					whisper: message.details.hidden ? 'true' : 'false',
				}
			}
		});
	}

	/**
	 * Converts a provided message object into instructions to create a thread.
	 * @param metadataConfig  Configuration of how to encode metadata
	 * @param message         object to analyse.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static createThreadIntoEmit(
		metadataConfig: MetadataConfiguration, message: TransmitInformation
	): Promise<DiscourseEmitInstructions> {
		// Check that we have a title.
		const title = message.details.title;
		if (!title) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a thread without a title.'
			));
		}
		// Bundle into a format for the service.
		const metadataString = TranslatorScaffold.stringifyMetadata(message, MetadataEncoding.HiddenMD, metadataConfig);
		const converter = DiscourseTranslator.convertUsernameToDiscourse;
		const messageString = TranslatorScaffold.convertPings(message.details.text, converter);
		return Promise.resolve({
			method: ['request'],
			payload: {
				htmlVerb: 'POST',
				path: '/posts',
				body: {
					category: message.target.flow,
					raw: `${messageString}\n${metadataString}`,
					title,
					unlist_topic: 'false',
				},
			}
		});
	}

	/**
	 * Converts a provided message object into instructions to create a message.
	 * @param connectionDetails  Details to use to retrieve the user object.
	 * @param metadataConfig     Configuration of how to encode the metadata.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static createMessageIntoEmit(
		connectionDetails: DiscourseConstructor, metadataConfig: MetadataConfiguration, message: TransmitInformation
	): Promise<DiscourseEmitInstructions> {
		// Check we have a thread.
		const thread = message.target.thread;
		if (!thread) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot create a comment without a thread.'
			));
		}
		if (message.details.hidden) {
			// Check that the account is allowed to whisper.
			const username = DiscourseTranslator.convertUsernameToDiscourse(message.target.username);
			return request({
				json: true,
				method: 'GET',
				qs: {
					api_key: connectionDetails.token,
					api_username: connectionDetails.username,
				},
				url: `${connectionDetails.protocol || 'https'}://${connectionDetails.instance}/users/${username}.json`,
			}).then((response) => {
				if (response.user.admin || response.user.moderator) {
					return DiscourseTranslator.bundleMessage(message, thread, metadataConfig);
				}
				return Promise.reject(new TranslatorError(
					TranslatorErrorCode.PermissionsError, 'Whisper requested, but account is not sufficiently privileged.'
				));
			});
		}
		return DiscourseTranslator.bundleMessage(message, thread, metadataConfig);
	}

	/**
	 * Converts a provided message object into instructions to read a thread
	 * @param message  object to analyse.
	 * @returns        Promise that resolves to emit instructions.
	 */
	private static searchThreadIntoEmit(message: TransmitInformation): Promise<DiscourseEmitInstructions> {
		// Check we have a thread.
		const thread = message.target.thread;
		if (!thread) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot search for connections without a thread.'
			));
		}
		// Bundle into a format for the service.
		return Promise.resolve({
			method: ['request'],
			payload: {
				htmlVerb: 'GET',
				path: '/search/query',
				qs: {
					term: message.source.service,
					'search_context[type]': 'topic',
					'search_context[id]': thread,
				}
			}
		});
	}

	private static readThreadIntoEmit(message: TransmitInformation): Promise<DiscourseEmitInstructions> {
		// Check we have a thread.
		const thread = message.target.thread;
		if (!thread) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot read a thread without a thread.'
			));
		}
		// Bundle into a format for the service.
		return Promise.resolve({
			method: ['request'],
			payload: {
				htmlVerb: 'GET',
				path: `/t/${thread}.json`,
			}
		});
	}

	/**
	 * Converts a provided message object into instructions to update the tags.
	 * @param connectionDetails  Details to use to retrieve the topic slug.
	 * @param message            object to analyse.
	 * @returns                  Promise that resolves to emit instructions.
	 */
	private static updateTagsIntoEmit(
		connectionDetails: DiscourseConstructor, message: TransmitInformation
	): Promise<DiscourseEmitInstructions> {
		// Check that we have a thread.
		const thread = message.target.thread;
		if (!thread) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot update tags without a thread.'
			));
		}
		// Check that we have an array of tags.
		const tags = message.details.tags;
		if (!_.isArray(tags)) {
			return Promise.reject(new TranslatorError(
				TranslatorErrorCode.IncompleteTransmitInformation, 'Cannot update tags without a tags array.'
			));
		}
		// Retrieve details of the topic, because tag updates need slug as well as ID.
		const getTopic = {
			json: true,
			method: 'GET',
			qs: {
				api_key: connectionDetails.token,
				api_username: connectionDetails.username,
			},
			url: `${connectionDetails.protocol || 'https'}://${connectionDetails.instance}/t/${message.target.thread}`,
		};
		return request(getTopic)
		.then((topicResponse) => {
			// Bundle into a format for the service.
			return {
				method: ['request'],
				payload: {
					body: {},
					htmlVerb: 'PUT',
					qs: {
						'tags[]': tags,
					},
					path: `/t/${topicResponse.slug}/${thread}.json`,
				}
			};
		});
	}

	/**
	 * Converts a response into a the generic format.
	 * @param details   Details of the translator's construction, used to properly populate the URL.
	 * @param _message  Not used, the initial message.
	 * @param response  The response provided by the service.
	 * @returns         Promise that resolves to emit instructions.
	 */
	private static convertCreateThreadResponse(
		details: DiscourseConstructor, _message: TransmitInformation, response: DiscourseResponse
	): Promise<CreateThreadResponse> {
		return Promise.resolve({
			thread: response.topic_id,
			url: `${details.protocol || 'https'}://${details.instance}/t/${response.topic_id}`
		});
	}

	/**
	 * Converts a response into a the generic format.
	 * @param metadataConfig  Configuration of how the metadata was encoded.
	 * @param message         The initial message that triggered this response.
	 * @param response        The response provided by the service.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static convertReadConnectionResponse(
		metadataConfig: MetadataConfiguration, message: TransmitInformation, response: DiscoursePostSearchResponse
	): Promise<SourceDescription> {
		const uncookedComments = _.map(response.posts, DiscourseTranslator.reverseEngineerComment);
		return Promise.resolve(TranslatorScaffold.extractSource(
			message.source,
			uncookedComments,
			metadataConfig,
			MetadataEncoding.HiddenHTML,
		));
	}

	/**
	 * Converts a response into a the generic format.
	 * @param message         The initial message that triggered this response.
	 * @param response        The response provided by the service.
	 * @returns               Promise that resolves to emit instructions.
	 */
	private static convertReadErrorResponse(
		_message: TransmitInformation, response: DiscoursePostSearchResponse
	): Promise<String[]> {
		const uncookedComments = _.map(response.posts, DiscourseTranslator.reverseEngineerComment);
		return Promise.resolve(uncookedComments);
	}

	/**
	 * Converts a response into a the generic format.
	 * @param _message   Not used, the initial message.
	 * @param _response  Not used, the response provided by the service.
	 * @returns          Promise that resolves to emit instructions.
	 */
	private static convertUpdateThreadResponse(
		_message: TransmitInformation, _response: DiscourseResponse
	): Promise<UpdateThreadResponse> {
		return Promise.resolve({});
	}

	private static convertReadThreadResponse(
		config: MetadataConfiguration,
		show: 'reply' | 'whisper' | 'all',
		_message: TransmitInformation,
		response: any,
	): Promise<TranslatorMetadata[]> {
		return Promise.resolve(_.compact(_.map(response.post_stream.posts, (comment) => {
			const messageObject = DiscourseTranslator.extractMetadata(comment.cooked, MetadataEncoding.HiddenHTML, config);
			if (show === 'all') {
				return messageObject;
			} else if ((show === 'reply') && (messageObject.hidden === false)) {
				return messageObject;
			} else if ((show === 'whisper') && (messageObject.hidden === true)) {
				return messageObject;
			}
		})));
	}

	protected eventEquivalencies = {
		message: ['post_created', 'post_edited'],
	};
	protected emitConverters: EmitConverters = {
		[MessengerAction.ReadConnection]: DiscourseTranslator.searchThreadIntoEmit,
		[MessengerAction.ReadErrors]: DiscourseTranslator.searchThreadIntoEmit,
		[MessengerAction.ListReplies]: DiscourseTranslator.readThreadIntoEmit,
		[MessengerAction.ListWhispers]: DiscourseTranslator.readThreadIntoEmit,
	};
	protected responseConverters: ResponseConverters = {
		[MessengerAction.UpdateTags]: DiscourseTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateMessage]: DiscourseTranslator.convertUpdateThreadResponse,
		[MessengerAction.CreateConnection]: DiscourseTranslator.convertUpdateThreadResponse,
		[MessengerAction.ReadErrors]: DiscourseTranslator.convertReadErrorResponse,
	};
	private connectionDetails: DiscourseConstructor;

	constructor(data: DiscourseConstructor, metadataConfig: MetadataConfiguration) {
		super(metadataConfig);
		this.connectionDetails = data;
		// These converters require the injection of a couple of details from `this` instance.
		this.emitConverters[MessengerAction.UpdateTags] =
			_.partial(DiscourseTranslator.updateTagsIntoEmit, data);
		this.emitConverters[MessengerAction.CreateThread] =
			_.partial(DiscourseTranslator.createThreadIntoEmit, metadataConfig);
		this.emitConverters[MessengerAction.CreateMessage] =
			_.partial(DiscourseTranslator.createMessageIntoEmit, data, metadataConfig);
		this.emitConverters[MessengerAction.CreateConnection] =
			_.partial(DiscourseTranslator.createMessageIntoEmit, data, metadataConfig);
		this.responseConverters[MessengerAction.ReadConnection] =
			_.partial(DiscourseTranslator.convertReadConnectionResponse, metadataConfig);
		this.responseConverters[MessengerAction.CreateThread] =
			_.partial(DiscourseTranslator.convertCreateThreadResponse, data);
		this.responseConverters[MessengerAction.ListReplies] =
			_.partial(DiscourseTranslator.convertReadThreadResponse, metadataConfig, 'reply');
		this.responseConverters[MessengerAction.ListWhispers] =
			_.partial(DiscourseTranslator.convertReadThreadResponse, metadataConfig, 'whisper');
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to an array of message objects in the standard form.
	 */
	public eventIntoMessages(event: DiscourseServiceEvent): Promise<MessengerEvent[]> {
		// Encode once the common parts of a request
		const getGeneric = {
			json: true,
			method: 'GET',
			qs: {
				api_key: this.connectionDetails.token,
				api_username: this.connectionDetails.username,
			},
			// appended before execution
			uri: `${this.connectionDetails.protocol || 'https'}://${this.connectionDetails.instance}`,
		};
		// Gather more complete details of the enqueued event
		const getPost = _.cloneDeep(getGeneric);
		getPost.uri += `/posts/${event.cookedEvent.id}`;
		const getTopic = _.cloneDeep(getGeneric);
		getTopic.uri += `/t/${event.cookedEvent.topic_id}`;
		return Promise.props({
			post: request(getPost),
			topic: request(getTopic),
		})
		.then((details: { post: any, topic: any }) => {
			// Generic has `-` at the end, Discourse has `_` at the beginning
			const convertedUsername = DiscourseTranslator.convertUsernameToGeneric(details.post.username);
			let metadata = TranslatorScaffold.emptyMetadata();
			switch (event.type) {
				// If this is an edit, then create a murmur to that effect
				case 'post_edited':
					metadata = TranslatorScaffold.emptyMetadata(`This thread was edited by ${convertedUsername}.`);
					metadata.hidden = 'preferred';
					break;
				// Find the metadata from the post created
				default:
					metadata = TranslatorScaffold.extractMetadata(
						details.post.raw, MetadataEncoding.HiddenMD, this.metadataConfig
					);
			}
			const images: Dictionary<string> = {};
			// Find every <img> tag in the HTML (cooked) string
			_.forEach(details.post.cooked.match(/<img[^>]*>/g), (imgTag) => {
				const attributes: Dictionary<string> = {};
				_.forEach(imgTag.match(/(\w+)="(\S+)"/g), (attributeText) => {
					const splitAttribute = attributeText.match(/(\w+)="(\S+)"/);
					attributes[splitAttribute[1]] = splitAttribute[2];
				});
				// Track them via their `alt` text
				images[attributes.alt] = attributes.src;
			});
			// Find every ![alt|size](url) (aka image) tag in the MD (raw) string
			const imgFinder = /!\[([^|]*)[|\]].*]\(.*?\)/;
			const imgReplacedText = metadata.content.replace(new RegExp(imgFinder, 'g'), (fullMatch) => {
				// Replace the MD img tags with raw URLs
				const imgAlt = fullMatch.match(new RegExp(imgFinder));
				if (!imgAlt) {
					return fullMatch;
				}
				return images[imgAlt[1]];
			});
			const quoteFinder = /\[quote="([^,"]*).*"]\s*([\s\S]*)\[\/quote]/;
			const quoteParsedText = imgReplacedText.replace(new RegExp(quoteFinder, 'gm'), (fullMatch) => {
				const matchArray = fullMatch.match(new RegExp(quoteFinder, 'm'));
				if (!matchArray) {
					return fullMatch;
				}
				const citation = `>*${matchArray[1]}*:`;
				const body = matchArray[2].trim().replace(/((?:^|\r|\n)+)/g, '\n>');
				return `${citation}${body}`;
			});
			const codeParsedText = quoteParsedText.replace(/\[\/?code]/g, '```');
			const cookedEvent: BasicMessageInformation = {
				details: {
					service: metadata.service || event.source,
					flow: metadata.flow || details.topic.category_id.toString(),
					handle: convertedUsername,
					// post_type 4 seems to correspond to whisper
					hidden: _.isSet(metadata.hidden) ? metadata.hidden : details.post.post_type === 4,
					tags: details.topic.tags,
					text: TranslatorScaffold.convertPings(codeParsedText, DiscourseTranslator.convertUsernameToGeneric),
					time: details.post.created_at,
					title: details.topic.title,
					messageCount: details.post.post_number,
				},
				source: {
					service: event.source,
					// These come in as integers, but should be strings
					flow: details.topic.category_id.toString(),
					message: details.post.id.toString(),
					thread: details.post.topic_id.toString(),
					url: getTopic.uri,
					username: convertedUsername,
				},
			};
			// Yield the object in a form suitable for service scaffold.
			return [{
				context: `${event.source}.${event.context}`,
				type: this.eventIntoMessageType(event),
				cookedEvent,
				rawEvent: event.rawEvent,
				source: 'messenger',
			}];
		});
	}

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param message  Message information, used to retrieve username
	 * @returns        The details required to construct an emitter.
	 */
	public messageIntoEmitterConstructor(message: TransmitInformation): DiscourseConstructor {
		const convertedUsername = DiscourseTranslator.convertUsernameToDiscourse(message.target.username);
		// Pass back details that may be used to connect.
		return {
			token: this.connectionDetails.token,
			username: convertedUsername,
			instance: this.connectionDetails.instance,
			protocol: this.connectionDetails.protocol,
			serviceName: 'discourse',
			type: ServiceType.Emitter,
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
		connectionDetails: DiscourseConstructor, genericDetails: MessengerConstructor
	): DiscourseConstructor {
		if (connectionDetails.ingress === undefined) {
			connectionDetails.ingress = genericDetails.ingress;
		}
		if (connectionDetails.type === undefined) {
			connectionDetails.type = genericDetails.type;
		}
		return connectionDetails;
	}
}

/**
 * Builds a translator that will convert Discourse specific information to and from Messenger format.
 * @param data            Construction details for creating a Discourse session.
 * @param metadataConfig  Configuration of how to encode metadata
 * @returns               A translator, ready to interpret Discourse's communications.
 */
export function createTranslator(data: DiscourseConstructor, metadataConfig: MetadataConfiguration): Translator {
	return new DiscourseTranslator(data, metadataConfig);
}
