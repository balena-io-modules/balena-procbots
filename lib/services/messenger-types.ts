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
	WorkerEvent,
} from '../framework/worker';
import {
	ServiceEmitContext,
	ServiceEmitResponse,
	ServiceEvent,
} from './service-types';

/** A standardised form of ServiceEvent that allows for common tasks to benefit from recycled code. */
export interface MessengerEvent extends ServiceEvent {
	cookedEvent: {
		context: string;
		type: string;
		[key: string]: any;
	};
	rawEvent: any;
	source: string;
}
/** A standardised form of WorkerEvent that allows for common tasks to benefit from recycled code. */
export interface MessengerWorkerEvent extends WorkerEvent {
	data: MessengerEvent;
}

/** An enum of the events types that a messenger service may understand */
export enum MessengerAction {
	Create,
}

/** The IDs that a message may provide */
export interface MessengerIds {
	user?: string;
	message?: string;
	thread?: string;
	token?: string;
	flow?: string;
	url?: string;
}
/** The data structure that a message must provide */
export interface MessengerContext {
	action: MessengerAction;
	first: boolean;
	genesis: string;
	hidden: boolean;
	source: string;
	sourceIds?: MessengerIds;
	tags?: string[];
	text: string;
	title?: string;
}

/** The IDs expected of a message when received */
export interface ReceiptIds extends MessengerIds {
	user: string;
	message: string;
	thread: string;
	flow: string;
}
/** The data structure expected of a message when received */
export interface ReceiptContext extends MessengerContext {
	sourceIds: ReceiptIds;
}

/** The data structure that deals with a message as it passes through the system */
export interface InterimContext extends MessengerContext {
	sourceIds: ReceiptIds;
	to: string;
	toIds: MessengerIds;
}

/** The IDs expected of a message once it is ready for transmission */
export interface TransmitIds extends MessengerIds {
	user: string;
	token: string;
	flow: string;
}
/** The context expected of a message once it is ready for transmission */
export interface TransmitContext extends MessengerContext {
	sourceIds: ReceiptIds;
	to: string;
	toIds: TransmitIds;
}

/** A more specific form of EmitContext that sets a common expectation when emitting a message. */
export interface MessengerEmitContext extends ServiceEmitContext {
	endpoint: object;
	meta?: any;
	payload: object;
}

/** A more specific form of EmitResponse that contains data in a message orientated fashion. */
export interface MessengerEmitResponse extends ServiceEmitResponse {
	response?: {
		message: string;
		thread: string;
		url?: string;
	};
}

/** String options that may be used in metadata to indicate if a comment is public. */
export interface PublicityIndicator {
	emoji: string;
	word: string;
	char: string;
}

/** Standard set of data that is required alongside the message. */
export interface Metadata {
	genesis: string | null;
	hidden: boolean;
	content: string;
}

/** Information that allows us to target a flow, for example in pairing equivalent flows. */
export interface FlowDefinition {
	service: string;
	flow: string;
}

/** A definition for a service that allows the retrieval of user-set values. */
export interface DataHub {
	/**
	 * Retrieve a value that a user has set.
	 * @param user   The user who's data set we wish to search.
	 * @param value  This should be 'key'.  It is the data we wish to search for.
	 */
	fetchValue(user: string, value: string): Promise<string>;
}
