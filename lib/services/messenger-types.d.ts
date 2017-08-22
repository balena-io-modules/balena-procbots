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
import { DataHub } from './messenger/datahubs/datahub';
import { ServiceScaffoldServiceEvent } from './service-scaffold-types';
import {
	ServiceEmitResponse, ServiceRegistration,
} from './service-types';

export interface MessageIds {
	service: string;
	username: string;
	message?: string;
	thread?: string;
	flow?: string;
	url?: string;
}
export interface ReceiptIds extends MessageIds {
	message: string;
	thread: string;
	flow: string;
}
export interface TransmitIds extends MessageIds {
	flow: string;
}

export interface Message {
	genesis: string;
	hidden: boolean;
	internal: boolean;
	text: string;
	title?: string;
}

declare const enum MessageAction {
	CreateThread, CreateMessage, ReadConnection,
}

export interface MessageInformation {
	details: Message;
	source: ReceiptIds;
}
export interface TransmitInformation extends MessageInformation {
	action: MessageAction;
	hub: {
		username: string;
	};
	target: TransmitIds;
}

export type MessageListenerMethod = (registration: ServiceRegistration, event: MessageEvent) => Promise<void>;

export interface MessageResponseData {
	message: string;
	thread: string;
	url?: string;
}

export interface MessageEmitResponse extends ServiceEmitResponse {
	response?: MessageResponseData;
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
	dataHubs: DataHub[];
	subServices: MessengerConnectionDetails;
}

export interface MessageEvent extends ServiceScaffoldServiceEvent {
	cookedEvent: MessageInformation;
}
