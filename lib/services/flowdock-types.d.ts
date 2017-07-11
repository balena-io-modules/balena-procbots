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

import { Session } from 'flowdock';
import {ServiceAPIHandle, ServiceEmitContext} from './service-types';
import {  UtilityServiceEvent } from './service-utilities-types';

export interface FlowdockMessagePayload {
	content: string;
	event: string;
	external_user_name?: string;
	thread_id?: string;
	flow?: string;
}

export interface FlowdockInboxPayload {
	content: string;
	from_address: string;
	source: string;
	subject: string;
	tags?: string[];
	roomId: string;
}

/** The Flowdock API SDK handle type. */
export interface FlowdockHandle extends ServiceAPIHandle {
	flowdock: Session;
}

export type FlowdockPayload = FlowdockMessagePayload | FlowdockInboxPayload;

export type FlowdockResponse = any;

export interface FlowdockEmitContext extends ServiceEmitContext {
	method: string;
	path: string;
	payload: FlowdockPayload;
}

export interface FlowdockConnectionDetails {
	organization: string;
	token: string;
}

export interface FlowdockEvent extends UtilityServiceEvent {
	cookedData: {
		flow: string;
	};
}
