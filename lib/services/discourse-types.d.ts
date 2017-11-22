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
import { UrlOptions } from 'request';
import { RequestPromiseOptions } from 'request-promise';
import { DiscourseService } from './discourse';
import { EmitData, EmitInstructions } from './messenger-types';
import { ServerDetails, ServiceScaffoldConstructor, ServiceScaffoldEvent } from './service-scaffold-types';
import { ServiceAPIHandle, ServiceEmitContext, ServiceType } from './service-types';

/** Common properties that all Discourse payloads share. */
export interface DiscourseBasePayload {
	/** The message text to be emitted. */
	raw: string;
}

/** Data required when creating a post. */
export interface DiscoursePostPayload extends DiscourseBasePayload {
	/** The ID of the topic to emit to. */
	topic_id: string;
	/** Whether this reply should be whispered. Should be either of the strings `true` or `false`, as a string. */
	whisper: string;
}

/** Data required when creating a topic. */
export interface DiscourseTopicPayload extends DiscourseBasePayload {
	/** The ID of the category to create a topic within. */
	category: string;
	/** The title of the topic to create. */
	title: string;
	/** Whether this topic should be hidden. Should be either of the strings `true` or `false`, as a string. */
	unlist_topic: string;
}

/** The union of all the ways of emitting data to Discourse. */
export type DiscoursePayload = DiscoursePostPayload | DiscourseTopicPayload | {};

/** The responses that the Discourse API may return. */
// https://github.com/resin-io-modules/resin-procbots/issues/207
export type DiscourseResponse = any;

/** Discourse specific subtype of the context for emission. */
export interface DiscourseEmitContext extends ServiceEmitContext {
	/** Data object that should be delivered to the API. */
	data: DiscourseEmitData;
	/** Method from the API that should be called. */
	method: DiscourseEmitMethod;
}

/** Typing of a method suitable for the actual interaction with the Discourse API. */
export type DiscourseEmitMethod = (requestOptions: UrlOptions & RequestPromiseOptions) => Promise<DiscourseResponse>;

/** Payload object that is passed to the Discourse emitter, which it then bundles for the API. */
export interface DiscourseEmitData extends EmitData {
	/** Verb, from the REST standard, that should be called. */
	htmlVerb: string;
	/** The path part of the URL endpoint. */
	path: string;
	/** The payload of, for example, a POST request. */
	body?: DiscoursePayload;
	/** The querystring of, for example, a GET request. */
	qs?: { [key: string]: string | string[] };
}

/** A more specific form of emit instructions which are used to route to an API method and provide a payload. */
export interface DiscourseEmitInstructions extends EmitInstructions {
	/** Payload to deliver to the SDK method. */
	payload: DiscourseEmitData;
}

/**
 * Details required to initialise the Discourse Service.
 */
export interface DiscourseConstructor extends ServiceScaffoldConstructor {
	/** Token used to emit to the service. Gathered by an administrator. */
	token: string;
	/** Username used to emit to the service. */
	username: string;
	/** Base URL of the instance to connect to. */
	instance: string;
	/** Protocol to use to connect to the instance. */
	protocol?: string;
}

/**
 * Details required to initialise the Discourse Service as a listener.
 */
export interface DiscourseListenerConstructor extends DiscourseConstructor {
	/** Endpoint path to listen to. Defaults to the name of the service. */
	path?: string;
	/** Shared secret, used to verify event payloads. */
	secret: string;
	/** Port number or server instance to listen to. */
	server: ServerDetails;
	/** Specifies that this listener must be a listener. */
	type: ServiceType.Listener;
}

/** Access type for the underlying SDK. */
export interface DiscourseHandle extends ServiceAPIHandle {
	/**
	 * Instance of the DiscourseService SDK that this Service is using.
	 * In the case of Discourse the Service is the SDK.
	 */
	discourse: DiscourseService;
}

/** A more specific ServiceEvent, to provided Discourse typing. */
export interface DiscourseServiceEvent extends ServiceScaffoldEvent {
	/** The parsed payload that Discourse gave us. */
	cookedEvent: DiscourseReceivedEvent;
	// We keep track of the payload string because Discourse is slightly fruity with it's JSON encoding.
	// It encodes (at least) <> as their \u... equivalent, and signs that, but JS's JSON built-in uses the <> characters.
	/** The raw payload string from Discourse. */
	rawEvent: string;
	/** The signature from Discourse, used to verify. */
	signature: string;
}

// https://github.com/resin-io-modules/resin-procbots/issues/207
/** For the moment a rather empty union of payloads Discourse might webhook to us. */
export type DiscourseReceivedEvent = DiscourseReceivedMessage;

// https://github.com/resin-io-modules/resin-procbots/issues/207
/** For the moment a rather empty object of a message payload from Discourse. */
export interface DiscourseReceivedMessage {
	/** ID of the message. */
	id: string;
	/** Topic ID of the message. */
	topic_id: string;
	/** Blurb of the message. */
	blurb: string;
	/** Cooked version of the message. */
	cooked: string;
}

// https://github.com/resin-io-modules/resin-procbots/issues/207
/** For the moment a rather empty object of the payload Discourse gives from a search. */
export interface DiscoursePostSearchResponse {
	posts: DiscourseReceivedMessage[];
}
