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
	InterimContext, MessageContext, MessageIds,
	Metadata, TransmitContext,
} from '../../services/messenger-types';
import {
	ServiceEmitContext, ServiceEvent,
} from '../../services/service-types';

export interface Translator {
	/**
	 * Translate the provided event, enqueued by the service, into a message context.
	 * @param event  Data in the form raw to the service.
	 */
	eventIntoMessage(event: ServiceEvent): Promise<MessageContext>;

	/**
	 * Translate the provided message context into an emit context that will create the message.
	 * @param message  Standard form of the message.
	 */
	messageIntoEmitCreateMessage(message: TransmitContext): Promise<ServiceEmitContext>;

	// messageIntoEmitCreateTopic

	// messageIntoEmitUpdateTags

	/**
	 * Translate the provided message context into an emit context that will retrieve the thread history.
	 * @param message    Standard form of the message.
	 * @param shortlist  *DO NOT RELY ON THIS BEING USED.*
	 *                   Optional, if the endpoint supports it then it may use this to shortlist the responses.
	 */
	messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<ServiceEmitContext>;

	/**
	 * Translate the provided generic name for an event into the service events to listen to.
	 * @param name  Generic name for an event.
	 */
	eventNameIntoTriggers(name: string): string[];
}

/**
 * Make a handle context, using a receipt context and some extra information.
 * @param event  Event to be converted.
 * @param to     Destination for the handle context.
 * @param toIds  Pre-populate the toIds, if desired.
 * @returns      Newly created context for handling a message.
 */
export function initInterimContext(event: MessageContext, to: string, toIds: MessageIds = {}): InterimContext {
	return {
		// Details from the ReceiptContext
		action: event.action,
		first: event.first,
		genesis: event.genesis,
		hidden: event.hidden,
		source: event.source,
		sourceIds: event.sourceIds,
		text: event.text,
		title: event.title,
		// Details from the arguments
		to,
		toIds,
	};
}

/**
 * Encode the metadata of an event into a string to embed in the message.
 * @param data    Event to gather details from.
 * @param format  Optional, markdown or plaintext, defaults to markdown.
 * @returns       Text with data embedded.
 */
export function stringifyMetadata(data: MessageContext, format: 'markdown'|'plaintext' = 'markdown'): string {
	const indicators = getIndicatorArrays();
	// Build the content with the indicator and genesis at the front
	switch (format) {
		case 'markdown':
			return `[${data.hidden ? indicators.hidden[0] : indicators.shown[0]}](${data.source})`;
		case 'plaintext':
			return `${data.hidden ? indicators.hidden[0] : indicators.shown[0]}:${data.source}`;
		default:
			throw new Error(`${format} format not recognised`);
	}
}

/**
 * Given a basic string this will extract a more rich context for the event, if embedded.
 * @param message  Basic string that may contain metadata.
 * @returns        Object of content, genesis and hidden.
 */
export function extractMetadata(message: string): Metadata {
	const indicators = getIndicatorArrays();
	const visible = indicators.shown.join('|\\');
	const hidden = indicators.hidden.join('|\\');
	// Anchored with new line; followed by whitespace.
	// Captured, the show/hide; brackets to enclose.
	// Then comes genesis; parens may surround.
	// The case we ignore; a Regex we form!
	const findMetadata = new RegExp(`(?:^|\\r|\\n)(?:\\s*)\\[?(${hidden}|${visible})\\]?:?\\(?(\\w*)\\)?`, 'i');
	const metadata = message.match(findMetadata);
	if (metadata) {
		// The content without the metadata, the word after the emoji, and whether the emoji is in the visible set
		return {
			content: message.replace(findMetadata, '').trim(),
			genesis: metadata[2] || null,
			hidden: !_.includes(indicators.shown, metadata[1]),
		};
	}
	// Return some default values if there wasn't any metadata
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
function getIndicatorArrays(): { 'shown': string[], 'hidden': string[] } {
	let shown;
	let hidden;
	try {
		// Retrieve publicity indicators from the environment
		shown = JSON.parse(process.env.MESSAGE_TRANSLATOR_PUBLIC_INDICATORS);
		hidden = JSON.parse(process.env.MESSAGE_TRANSLATOR_PRIVATE_INDICATORS);
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
 * @return      The newly instantiated Translator.
 */
export function createTranslator(name: string, data: any): Translator {
	return require(name).createTranslator(data);
}
