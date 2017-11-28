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

import TypedError = require('typed-error');
import * as Promise from 'bluebird';
import {
	EmitInstructions,
	MessengerConstructor,
	MessengerEvent,
	MessengerResponse,
	TransmitInformation,
} from '../../messenger-types';
import { ServiceEvent } from '../../service-types';
import {
	MetadataConfiguration,
	TranslatorErrorCode,
} from './translator-types';

/**
 * A TypedError that encapsulates some details specific to Translators.
 */
export class TranslatorError extends TypedError {
	/** What category of thing went wrong. */
	public code: TranslatorErrorCode;

	/**
	 * @param code     The sub-type of this error.
	 * @param message  The error message, is stored in the standard location.
	 */
	constructor(code: TranslatorErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

/**
 * A translator is responsible for converting between:
 * - The specifics of a service's interactions.
 * - The communal standard for messages.
 */
export interface Translator {
	/**
	 * Extract from an event (in the form specific to this service) a message type (in messenger phrasing).
	 * @param event  Event to analyse.
	 * @returns      Generic name for the event.
	 */
	eventIntoMessageType(event: MessengerEvent): string;

	/**
	 * Convert a messenger phrased message type into a set of specific events.
	 * @param type  Generic name for the event.
	 * @returns     A list of specific events to listen to.
	 */
	messageTypeIntoEventTypes(type: string): string[];

	/**
	 * Retrieve all of the events (in service specific phrasing) that this translator supports.
	 * @returns  The list of specific event names understood.
	 */
	getAllEventTypes(): string[];

	/**
	 * Promise to convert a provided event (in service specific form) into a message (in messenger form).
	 * @param event  Service specific event, straight out of the ServiceListener.
	 * @returns      Promise that resolves to an array of message objects in the standard form
	 */
	eventIntoMessages(event: ServiceEvent): Promise<MessengerEvent[]>;

	/**
	 * Promise to provide emitter construction details for a provided message.
	 * @param message  Message information, used to retrieve username
	 * @returns        The details required to construct an emitter.
	 */
	messageIntoEmitterConstructor(message: TransmitInformation): object;

	/**
	 * Populate the listener constructor with details from the more generic constructor.
	 * Provided since the connectionDetails might need to be parsed from JSON and the server details might be instantiated.
	 * @param connectionDetails  Construction details for the service, probably 'inert', ie from JSON.
	 * @param genericDetails     Details from the construction of the messenger.
	 * @returns                  Connection details with the value merged in.
	 */
	mergeGenericDetails(connectionDetails: object, genericDetails: MessengerConstructor): object;

	/**
	 * Convert the provided message into details that may be passed to the emitter.
	 * @param message  Message object, in generic form, to create a payload from.
	 * @returns        Promise to provide the payload that may be passed straight to the emitter.
	 */
	messageIntoEmitDetails(message: TransmitInformation): Promise<EmitInstructions>;

	/**
	 * Convert the response from the emitter into a generic form
	 * @param message   The original message, only used in services where the response is incomplete
	 * @param response  The response from the emitter to convert
	 * @returns         A promise that resolves to the generic form of the response
	 */
	responseIntoMessageResponse(message: TransmitInformation, response: any): Promise<MessengerResponse>;
}

/**
 * Retrieves and loads a Translator by name.
 * @param name            The name of the Utils to load.
 * @param data            The constructor object for the createTranslator method.
 * @param metadataConfig  Configuration of how the translator should encode metadata.
 * @return                The newly instantiated Utils.
 */
export function createTranslator(name: string, data: any, metadataConfig: MetadataConfiguration): Translator {
	return require(`./${name}`).createTranslator(data, metadataConfig);
}
