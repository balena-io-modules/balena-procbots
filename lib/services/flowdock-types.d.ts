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
import { EmitData, EmitInstructions } from './messenger-types';
import { ServiceScaffoldConstructor, ServiceScaffoldEvent } from './service-scaffold-types';
import { ServiceAPIHandle, ServiceEmitContext }  from './service-types';

/** Common data requirements that text based payloads share. */
export interface FlowdockTextPayload {
	content: string;
}

/** Data required when creating a message. */
export interface FlowdockMessagePayload extends FlowdockTextPayload {
	event: string;
	external_user_name?: string;
	thread_id?: string;
	flow?: string;
}

/** Data required when posting to an Inbox. */
export interface FlowdockInboxPayload extends FlowdockTextPayload {
	from_address: string;
	source: string;
	subject: string;
	tags?: string[];
	roomId: string;
}

/** Data required when retrieving messages. */
export interface FlowdockListMessagesPayload {
	limit?: string;
	search?: string;
}

/** Data required when updating tags. */
export interface FlowdockTagsPayload {
	tags: string[];
}

/** The union of all the payloads that may be emitted to Flowdock. */
export type FlowdockPayload =
	FlowdockMessagePayload | FlowdockInboxPayload | FlowdockListMessagesPayload | FlowdockTagsPayload | undefined
;

/** The Flowdock API SDK handle type. */
export interface FlowdockHandle extends ServiceAPIHandle {
	flowdock: Session;
}

/** The responses that the Flowdock SDK may return. */
export type FlowdockResponse = any;

/** Payload object that is passed to the emitter, which it then bundles for the SDK. */
export interface FlowdockEmitData extends EmitData {
	path: string;
	payload?: FlowdockPayload;
}

/** A more specific form of emit instructions which are used to route to an SDK method and provide a payload. */
export interface FlowdockEmitInstructions extends EmitInstructions {
	payload: FlowdockEmitData;
}

/** A typing around the pattern that Flowdock expects provided callback methods to conform to. */
type Callback = (error: Error, response: FlowdockResponse) => void;

/** A typing around the pattern that the Flowdock SDK emit method use. */
export type FlowdockEmitMethod = (path: string, payload: FlowdockPayload, callback: Callback) => void;

/** Flowdock specific subtype of the context for emission. */
export interface FlowdockEmitContext extends ServiceEmitContext {
	data: FlowdockEmitData;
	method: FlowdockEmitMethod;
}

/** A message template, rather sparse and ripe for expansion */
export interface FlowdockMessage {
	content: string;
	[key: string]: string;
}

/** Details required to initialise the service. */
export interface FlowdockConstructor extends ServiceScaffoldConstructor {
	token: string;
}

/**
 * A flowdock specific form of the events that service scaffold creates.
 * Since many of Flowdock's raw events miss out the flow they happen in...
 * we're going to insist they get passed through from elsewhere (such as the
 * registration for example).
 */
export interface FlowdockEvent extends ServiceScaffoldEvent {
	cookedEvent: {
		flow: string;
	};
}
