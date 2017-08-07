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
import { DataHub } from '../utils/datahubs/datahub';
import {
	ServiceEmitContext,
	ServiceEmitResponse, ServiceRegistration,
} from './service-types';
import { UtilityServiceEvent } from './service-utilities-types';

// export enum MessageAction {
// 	Create,
// }

// Generic forms of message objects
export interface MessageIds {
	service: string;
	user?: string;
	message?: string;
	thread?: string;
	flow?: string;
	url?: string;
}
export interface ReceiptIds extends MessageIds {
	service: string;
	user: string;
	message: string;
	thread: string;
	flow: string;
}
// Message objects suitable for the transmission of messages
export interface TransmitIds extends MessageIds {
	service: string;
	user: string;
	flow: string;
}

export interface MessageDetails {
	genesis: string;
	hidden: boolean;
	text: string;
	title?: string;
}

export interface MessageContext {
	details: MessageDetails;
	source: ReceiptIds;
}
// Message objects suitable for the handling of messages
export interface InterimContext extends MessageContext {
	target: MessageIds;
}
export interface TransmitContext extends MessageContext {
	target: TransmitIds;
}

export type MessageListenerMethod = (registration: ServiceRegistration, event: MessageEvent) => Promise<void>;

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

export interface MessengerConnectionDetails {
	[serviceName: string]: object;
}

export interface MessengerConstructionDetails {
	dataHub: DataHub;
	subServices: MessengerConnectionDetails;
}

export interface MessageEvent extends UtilityServiceEvent {
	rawEvent: MessageContext;
}
