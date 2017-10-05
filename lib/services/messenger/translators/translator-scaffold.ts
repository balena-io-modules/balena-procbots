/*
 Copyright 2017 Resin.io

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
import {
	BasicMessageInformation, EmitInstructions, MessengerConstructor, MessengerEvent,
	MessengerResponse, TransmitInformation,
} from '../../messenger-types';
import { ServiceScaffoldEvent } from '../../service-scaffold-types';
import { Translator, TranslatorError } from './translator';
import {
	EmitConverters, EventEquivalencies, PublicityIndicator,
	ResponseConverters, TranslatorErrorCode, TranslatorMetadata,
} from './translator-types';

/**
 * Class to help build a translator to convert between messenger standard forms
 * and service specific forms.
 */
export abstract class TranslatorScaffold implements Translator {
	/**
	 * Encode the metadata of an event into a string to embed in the message.
	 * @param data    Event to gather details from.
	 * @param format  Optional, markdown or plaintext, defaults to markdown.
	 * @returns       Text with data embedded.
	 */
	protected static stringifyMetadata(data: BasicMessageInformation, format: string): string {
		const indicators = data.details.hidden ?
			TranslatorScaffold.getIndicatorArrays().hidden :
			TranslatorScaffold.getIndicatorArrays().shown;
		switch (format) {
			case 'human':
				return `(${indicators.word} from ${data.source.service})`;
			case 'emoji':
				return `[${indicators.emoji}](${data.source.service})`;
			case 'logo':
				const baseUrl = process.env.MESSAGE_TRANSLATOR_IMG_BASE_URL;
				const queryString = `?hidden=${indicators.word}&source=${data.source.service}`;
				return `<img src="${baseUrl}${queryString}" height="18" \/> ${TranslatorScaffold.messageOfTheDay()}`;
			default:
				throw new Error(`${format} format not recognised`);
		}
	}

	/**
	 * Given a basic string this will extract a more rich context for the event, if embedded.
	 * @param message  Basic string that may contain metadata.
	 * @param format   Format of the metadata encoding.
	 * @returns        Object of content, genesis and hidden.
	 */
	protected static extractMetadata(message: string, format: string): TranslatorMetadata {
		const indicators = TranslatorScaffold.getIndicatorArrays();
		const wordCapture = `(${indicators.hidden.word}|${indicators.shown.word})`;
		const beginsLine = '(?:^|\\r|\\n)(?:\\s*)';
		const endsLine = '(?:\\s*)(?:$|\\r|\\n)';
		switch (format.toLowerCase()) {
			case 'char':
				const charCapture = `(${_.escapeRegExp(indicators.hidden.char)}|${_.escapeRegExp(indicators.shown.char)})`;
				const charRegex = new RegExp(`${beginsLine}${charCapture}`);
				return TranslatorScaffold.metadataByRegex(message, charRegex);
			case 'human':
				const parensRegex = new RegExp(`${beginsLine}\\(${wordCapture} from (\\w*)\\)${endsLine}`, 'i');
				return TranslatorScaffold.metadataByRegex(message, parensRegex);
			case 'emoji':
				const emojiCapture = `(${indicators.hidden.emoji}|${indicators.shown.emoji})`;
				const emojiRegex = new RegExp(`${beginsLine}\\[?${emojiCapture}\\]?\\(?(\\w*)\\)?`, 'i');
				return TranslatorScaffold.metadataByRegex(message, emojiRegex);
			case 'logo':
				const baseUrl = _.escapeRegExp(process.env.MESSAGE_TRANSLATOR_IMG_BASE_URL);
				const query = `\\?hidden=${wordCapture}&source=(\\w*)`;
				const imgRegex = new RegExp(`<img src="${baseUrl}${query}" height="18" \/>(?:.*)${endsLine}`, 'i');
				return TranslatorScaffold.metadataByRegex(message, imgRegex);
			default:
				throw new Error(`${format} format not recognised`);
		}
	}

	/**
	 * Generic handler for stock metadata regex, must match the syntax of:
	 * first match is the indicator of visibility, second match is message source, remove the whole match for content.
	 * @param message String to evaluate into metadata.
	 * @param regex   Criteria for extraction.
	 * @returns       Object of the metadata, decoded.
	 */
	private static metadataByRegex(message: string, regex: RegExp): TranslatorMetadata {
		const indicators = TranslatorScaffold.getIndicatorArrays();
		const metadata = message.match(regex);
		if (metadata) {
			return {
				content: message.replace(regex, '').trim(),
				genesis: metadata[2] || null,
				hidden: !_.includes(_.values(indicators.shown), metadata[1]),
			};
		}
		return {
			content: message.trim(),
			genesis: null,
			hidden: true,
		};
	}

	/** Return a string, based on the day, from the configured MOTD array */
	private static messageOfTheDay(): string {
		try {
			const messages = JSON.parse(process.env.MESSAGE_TRANSLATOR_MESSAGES_OF_THE_DAY);
			const daysSinceDatum = Math.floor(new Date().getTime() / 86400000);
			return messages[daysSinceDatum % messages.length];
		} catch (error) {
			throw new Error('MESSAGE_TRANSLATOR_MESSAGES_OF_THE_DAY not set correctly, motd not json.');
		}
	}

	/**
	 * Retrieve from the environment array of strings to use as indicators of visibility.
	 * @returns  Object of arrays of indicators, shown and hidden.
	 */
	private static getIndicatorArrays(): { 'shown': PublicityIndicator, 'hidden': PublicityIndicator } {
		let indicators;
		try {
			// Retrieve publicity indicators from the environment
			indicators = JSON.parse(process.env.MESSAGE_TRANSLATOR_PRIVACY_INDICATORS);
		} catch (error) {
			throw new Error('MESSAGE_TRANSLATOR_PRIVACY_INDICATORS not JSON.');
		}
		if (
			indicators.shown.emoji && indicators.shown.char && indicators.shown.word &&
			indicators.hidden.emoji && indicators.hidden.char && indicators.hidden.word
		) {
			return indicators;
		}
		throw new Error('MESSAGE_TRANSLATOR_PRIVACY_INDICATORS not set correctly.');
	}

	/**
	 * A dictionary of messenger event names, eg post, into service specific events, eg inbound_message, outbound_message.
	 */
	protected abstract eventEquivalencies: EventEquivalencies;

	/**
	 * Contains methods that may be invoked by the public messageIntoEmitDetails
	 * method and will convert between service specific and communal (messenger) formats.
	 */
	protected abstract emitConverters: EmitConverters;

	/**
	 * Contains methods that may be invoked by the public
	 * responseIntoMessageResponse method and will convert
	 * between specific and generic formats.
	 */
	protected abstract responseConverters: ResponseConverters;

	/**
	 * Convert the provided message into details that may be passed to the emitter.
	 * @param message  Message object, in generic form, to create a payload from.
	 * @returns        Promise to provide the payload that may be passed straight to the emitter.
	 */
	public messageIntoEmitDetails(message: TransmitInformation): Promise<EmitInstructions> {
		// This searches the abstract lookup object for a match on the action desired.
		const converter = this.emitConverters[message.action];
		if (converter) {
			return converter(message);
		}
		// Rejecting if the inherited child translator has registered no suitable method.
		return Promise.reject(new TranslatorError(
			TranslatorErrorCode.EmitUnsupported,
			`${message.action} not translatable to ${message.target.service} yet.`,
		));
	}

	/**
	 * Convert the response from the emitter into a generic form
	 * @param message   The original message, only used in services where the response is incomplete
	 * @param response  The response from the emitter to convert
	 * @returns         A promise that resolves to the generic form of the response
	 */
	public responseIntoMessageResponse(
		message: TransmitInformation, response: any
	): Promise<MessengerResponse> {
		// This searches the abstract lookup object for a match on the action desired.
		const converter = this.responseConverters[message.action];
		if (converter) {
			return converter(message, response);
		}
		// Rejecting if the inherited child translator has registered no suitable method.
		return Promise.reject(new TranslatorError(
			TranslatorErrorCode.ResponseUnsupported,
			`Message action ${message.action} not translatable from ${message.target.service} yet.`,
		));
	}

	/**
	 * Find the generic name for a provided event.
	 * @param event  Event to analyse.
	 * @returns      Generic name for the event.
	 */
	public eventIntoMessageType(event: MessengerEvent): string {
		return _.findKey(this.eventEquivalencies, (value: string[]) => {
			return _.includes(value, event.type);
		}) || 'Unrecognised event';
	}

	/**
	 * Find the specific events to listen to for a generic event type.
	 * @param type  Generic name for the event.
	 * @returns     A list of specific events to listen to.
	 */
	public messageTypeIntoEventTypes(type: string): string[] {
		return this.eventEquivalencies[type];
	}

	/**
	 * Find all the events this translator understands.
	 * @returns  The list of specific event names understood.
	 */
	public getAllEventTypes(): string[] {
		return _.flatMap(this.eventEquivalencies);
	}

	/**
	 * Promise to convert a provided service specific event into messenger's standard form.
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to the standard form of the message.
	 */
	public abstract eventIntoMessage(event: ServiceScaffoldEvent): Promise<MessengerEvent>

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param message  Message information, used to retrieve username
	 * @returns        Promise that resolves to the details required to construct an emitter.
	 */
	public abstract messageIntoEmitterConstructor(message: TransmitInformation): Promise<object>

	/**
	 * Populate the listener constructor with details from the more generic constructor.
	 * Provided since the connectionDetails might need to be parsed from JSON and the server details might be instantiated.
	 * @param connectionDetails  Construction details for the service, probably 'inert', ie from JSON.
	 * @param genericDetails     Details from the construction of the messenger.
	 * @returns                  Connection details with the value merged in.
	 */
	public abstract mergeGenericDetails(connectionDetails: object, genericDetails: MessengerConstructor): object
}
