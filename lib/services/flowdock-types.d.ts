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
import { MessengerEmitContext } from './messenger-types';
import { ServiceAPIHandle } from './service-types';

/** A payload template for posting to the main stream of a room */
export interface FlowdockMessagePayload {
	content: string;
	event: string;
	external_user_name?: string;
	tags?: string[];
	thread_id?: string;
	flow?: string;
}

/** A payload template for posting to the integration panel of a room */
export interface FlowdockInboxPayload {
	content: string;
	from_address: string;
	source: string;
	subject: string;
	roomId: string;
}

/** A payload template, rather sparse but feel free to expand, for updating messages. */
export interface FlowdockMessageUpdatePayload {
	tags?: string[];
}

/** A template for emitting data to flowdock */
export interface FlowdockEmitContext extends MessengerEmitContext {
	endpoint: {
		method: string;
		token: string;
		url: string;
	};
	meta?: {
		flow: string;
		org: string;
	};
	payload: FlowdockInboxPayload | FlowdockMessagePayload | FlowdockMessageUpdatePayload;
}

/** A message template, rather sparse and ripe for expansion */
export interface FlowdockMessage {
	content: string;
	[key: string]: string;
}

/** The Flowdock API SDK handle type. */
export interface FlowdockHandle extends ServiceAPIHandle {
	flowdock: Session;
}

/** The details required to build a Flowdock session */
export interface FlowdockConstructor {
	organization: string;
	token: string;
}
