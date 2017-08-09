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
	InterimContext, MessageContext, MessageEvent, MessageIds,
	Metadata, TransmitContext,
} from '../../messenger-types';
import {
	ServiceEmitContext, ServiceEvent,
} from '../../service-types';
import { DataHub } from '../datahubs/datahub';

export interface PublicityIndicator {
	emoji: string;
	word: string;
	char: string;
}

export interface Translator {
	// TODO: This does not belong here but is going here for now.
	// This is to reconcile:
	// * Some services require credentials provided by the user in the hub service
	// * Some services require centrally provided credentials
	// * An emitter operates with exactly one set of credentials
	// This maybe shouldn't use dataHub and could just use the getter function
	// makeEmitter(specificFetcher: (key: string) => Promise<string>, genericDetails: object): Promise<ServiceEmitter>;

	/**
	 * Translate the provided event, enqueued by the service, into a message context.
	 * @param event  Data in the form raw to the service.
	 */
	eventIntoMessage(event: ServiceEvent): Promise<MessageEvent>;

	/**
	 * Translate the provided message context into an emit context that will create the message.
	 * @param message  Standard form of the message.
	 */
	messageIntoEmitCreateMessage(message: TransmitContext): Promise<ServiceEmitContext>;

	// messageIntoEmitCreateTopic

	// messageIntoEmitUpdateTags

	messageIntoConnectionDetails(message: TransmitContext): Promise<object>;

	/**
	 * Translate the provided message context into an emit context that will retrieve the thread history.
	 * @param message    Standard form of the message.
	 * @param shortlist  *DO NOT RELY ON THIS BEING USED.*
	 *                   Optional, if the API supports it then it may use this to shortlist the responses server-side.
	 */
	messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<ServiceEmitContext>;

	/**
	 * Translate the provided generic name for an event into the service events to listen to.
	 * @param name  Generic name for an event.
	 */
	eventNameIntoTriggers(name: string): string[];

	/**
	 * Returns an array of all the service events that may be translated.
	 */
	getAllTriggers(): string[];
}

/**
 * Make a handle context, using a receipt context and some extra information.
 * @param event  Event to be converted.
 * @param target Destination for the handle context.
 * @returns      Newly created context for handling a message.
 */
// TODO: Transfer this across to syncbot.ts
export function initInterimContext(event: MessageContext, target: MessageIds | string): InterimContext {
	return {
		// Details from the ReceiptContext
		details: event.details,
		source: event.source,
		target: _.isString(target) ? { service: target } : target,
	};
}

/**
 * Encode the metadata of an event into a string to embed in the message.
 * @param data    Event to gather details from.
 * @param format  Optional, markdown or plaintext, defaults to markdown.
 * @returns       Text with data embedded.
 */
export function stringifyMetadata(data: MessageContext, format: string): string {
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
		content: message,
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
 * @param hub   The source for any extra information required.
 * @return      The newly instantiated Translator.
 */
export function createTranslator(name: string, data: any, hub: DataHub): Translator {
	return require(`./${name}`).createTranslator(data, hub);
}
