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
import {
	MessageEvent, MessageInformation, MessageResponseData,
	Metadata, TransmitInformation,
} from '../../messenger-types';
import { ServiceEvent } from '../../service-types';
import { DataHub } from '../datahubs/datahub';

export interface PublicityIndicator {
	emoji: string;
	word: string;
	char: string;
}

export interface Translator {
	eventIntoMessageType(event: MessageEvent): string;
	messageTypeIntoEventTypes(type: string): string[];
	getAllEventTypes(): string[];

	eventIntoMessage(event: ServiceEvent): Promise<MessageEvent>;

	messageIntoConnectionDetails(message: TransmitInformation): Promise<object>;

	messageIntoEmitDetails(message: TransmitInformation): {method: string[], payload: any};

	responseIntoMessageResponse(
		payload: TransmitInformation, response: any
	): MessageResponseData;
}

/**
 * Encode the metadata of an event into a string to embed in the message.
 * @param data    Event to gather details from.
 * @param format  Optional, markdown or plaintext, defaults to markdown.
 * @returns       Text with data embedded.
 */
export function stringifyMetadata(data: MessageInformation, format: string): string {
	const indicators = data.details.hidden ? getIndicatorArrays().hidden : getIndicatorArrays().shown;
	switch (format) {
		case 'human':
			return `${indicators.word} from ${data.source.service}`;
		case 'emoji':
			return `[${indicators.emoji}](${data.source.service})`;
		case 'img':
			const baseUrl = process.env.MESSAGE_CONVERTER_IMG_BASE_URL;
			const queryString = `?hidden=${indicators.word}&source=${data.source.service}`;
			return `<img src="${baseUrl}${queryString}" height="18" \/>`;
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
export function extractMetadata(message: string, format: string): Metadata {
	const indicators = getIndicatorArrays();
	const wordCapture = `(${indicators.hidden.word}|${indicators.shown.word})`;
	const beginsLine = `(?:^|\\r|\\n)(?:\\s*)`;
	switch (format.toLowerCase()) {
		case 'char':
			const charCapture = `(${_.escapeRegExp(indicators.hidden.char)}|${_.escapeRegExp(indicators.shown.char)})`;
			const charRegex = new RegExp(`${beginsLine}${charCapture}`);
			return metadataByRegex(message, charRegex);
		case 'human':
			const parensRegex = new RegExp(`${beginsLine}\\(${wordCapture} from (\\w*)\\)`, 'i');
			return metadataByRegex(message, parensRegex);
		case 'emoji':
			const emojiCapture = `(${indicators.hidden.emoji}|${indicators.shown.emoji})`;
			const emojiRegex = new RegExp(`${beginsLine}\\[${emojiCapture}\\]\\((\\w*)\\)`, 'i');
			return metadataByRegex(message, emojiRegex);
		case 'img':
			const baseUrl = _.escapeRegExp(process.env.MESSAGE_CONVERTER_IMG_BASE_URL);
			const querystring = `\\?hidden=${wordCapture}&source=(\\w*)`;
			const imgRegex = new RegExp(`${beginsLine}<img src="${baseUrl}${querystring}" height="18" \/>`, 'i');
			return metadataByRegex(message, imgRegex);
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
function metadataByRegex(message: string, regex: RegExp): Metadata {
	const indicators = getIndicatorArrays();
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

/**
 * Retrieve from the environment array of strings to use as indicators of visibility.
 * @returns  Object of arrays of indicators, shown and hidden.
 */
function getIndicatorArrays(): { 'shown': PublicityIndicator, 'hidden': PublicityIndicator } {
	let shown;
	let hidden;
	try {
		// Retrieve publicity indicators from the environment
		shown = JSON.parse(process.env.MESSAGE_TRANSLATOR_PUBLICITY_INDICATORS_OBJECT);
		hidden = JSON.parse(process.env.MESSAGE_TRANSLATOR_PRIVACY_INDICATORS_OBJECT);
	} catch (error) {
		throw new Error('Message convertor environment variables not set correctly');
	}
	if (shown.length === 0 || hidden.length === 0) {
		throw new Error('Message convertor environment variables not set correctly');
	}
	return { hidden, shown };
}

/**
 * Retrieves and loads a Translator by name.
 * @param name  The name of the Translator to load.
 * @param data  The constructor object for the createTranslator method.
 * @param hubs  The sources for any extra information required.
 * @return      The newly instantiated Translator.
 */
export function createTranslator(name: string, data: any, hubs: DataHub[]): Translator {
	return require(`./${name}`).createTranslator(data, hubs);
}
