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
	ServiceEmitContext,
	ServiceEmitResponse,
} from './service-types';

export enum MessageAction {
	Create,
}

// Generic forms of message objects
export interface MessageIds {
	user?: string;
	message?: string;
	thread?: string;
	token?: string;
	flow?: string;
	url?: string;
}
export interface ReceiptIds extends MessageIds {
	user: string;
	message: string;
	thread: string;
	flow: string;
}
export interface MessageContext {
	action: MessageAction;
	first: boolean;
	genesis: string;
	hidden: boolean;
	source: string;
	sourceIds: ReceiptIds;
	text: string;
	title?: string;
}

// Message objects suitable for the handling of messages
export interface InterimContext extends MessageContext {
	to: string;
	toIds: MessageIds;
}

// Message objects suitable for the transmission of messages
export interface TransmitIds extends MessageIds {
	user: string;
	token: string;
	flow: string;
}
export interface TransmitContext extends MessageContext {
	to: string;
	toIds: TransmitIds;
}

export interface MessageEmitContext extends ServiceEmitContext {
	endpoint: object;
	meta?: any;
	payload: object;
}

export interface MessageEmitResponse extends ServiceEmitResponse {
	response?: {
		message: string;
		thread: string;
		url?: string;
	};
}

export interface Metadata {
	genesis: string | null;
	hidden: boolean;
	content: string;
}

export interface FlowDefinition {
	service: string;
	flow: string;
}