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
import { Translator } from './messenger/translators/translator';
import { MetadataConfiguration } from './messenger/translators/translator-types';
import { ServiceScaffoldConstructor, ServiceScaffoldEvent } from './service-scaffold-types';
import { ServiceEmitResponse, ServiceRegistration } from './service-types';

/** The basic IDs that all messages shall possess. */
export interface MessengerBaseIds {
	/** The name of the service. */
	service: string;
	/** The username message to the event, in github form. */
	username: string;
	/** The ID of the flow. */
	flow: string;
	/** The ID of the message, if relevant. */
	message?: string;
	/** The ID of the thread, if relevant. */
	thread?: string;
	/** A url for this resource, if possible. */
	url?: string;
}

/** A more specific list of IDs that all received messages shall posses. */
export interface ReceiptIds extends MessengerBaseIds {
	/** The ID of the message. */
	message: string;
	/** The ID of the thread. */
	thread: string;
}

export type PrivacyPreference = boolean | 'preferred';

/** The details that all messages shall possess. */
export interface MessageDetails {
	/** The originating service that the message synced from */
	service: string;
	/** The originating flow that the message synced from */
	flow: string;
	/** The alias relevant to this message, in github form. */
	handle: string;
	/** Whether this message should be publicly visible. */
	hidden: PrivacyPreference;
	// https://github.com/resin-io-modules/resin-procbots/issues/301
	/** For Intercom messages on Front, whether they had an empty subject line */
	intercomHack?: boolean;
	/** An array of the tags associated with the thread. */
	tags: string[];
	/** The actual message string. */
	text: string;
	/**
	 * The time a message was created.
	 * This can be in any format understood by the momentjs constructor
	 */
	time: string;
	/** The title of the thread. */
	title: string;
	/** A count of how many comments there are in this thread. */
	messageCount?: number;
}

/**
 * A base class that translator code is very likely to extend.
 * Defines the payload that may be passed to the emitter.
 */
export interface EmitData {
	/**
	 * A dictionary of properties that the translator will understand.
	 * At this stage it is very plenipotentiary, but the translator will specify further.
	 */
	[key: string]: any;
}

/**
 * A base class that translator code is very likely to extend, making payload more specific.
 * This specifies that there shall be an array of strings that define the method in the SDK to call.
 */
export interface EmitInstructions {
	/** Defines a path within the SDK for a method to call. */
	method: string[];
	/**
	 * The payload that the SDK will understand.
	 * Should be overwritten with the more specific form of EmitData.
	 */
	payload: EmitData;
}

/** The types of event that may be translated for emission. */
export const enum MessengerAction {
	CreateThread, CreateMessage, ReadConnection, UpdateTags, ArchiveThread, ReadErrors, ListReplies, ListWhispers,
}

/** The form that all messages events shall possess, both generally and as received. */
export interface BasicMessageInformation {
	/** Details of the message itself. */
	details: MessageDetails;
	/** Where the message came from. */
	source: ReceiptIds;
}

/** The requirements that a message fulfill for transmission through Messenger. */
export interface TransmitInformation extends BasicMessageInformation {
	/** Action that should be undertaken */
	action: MessengerAction;
	/** Where the action should happen. */
	target: MessengerBaseIds;
}

/** Defines that MessageListeners should operate using MessengerEvents, rather than generic ServiceEvents. */
export type MessageListener = (registration: ServiceRegistration, event: MessengerEvent) => Promise<void>;

export type TranslatorDictionary = { [service: string]: Translator };

/** Defines that when we emit a message we don't actually require any details back. */
export interface UpdateThreadResponse {}

/** Defines that when we emit a thread we expect it's id and url. */
export interface CreateThreadResponse {
	/** The ID of the thread. */
	thread: string;
	/** A url locating the thread. */
	url: string;
}

/** Defines that when we ask about connected threads we expect a threadId back. */
export interface SourceDescription {
	/** The flow ID of the thread found. */
	flow?: string;
	/** The ID of the thread found. */
	thread: string;
	/** The service of the thread found. */
	service?: string;
}

/** The possible response objects from a messenger emit request. */
export type MessengerResponse = UpdateThreadResponse | SourceDescription | CreateThreadResponse;

/** Defines that when a Message event resolves it does so using the more specific types. */
export interface MessengerEmitResponse extends ServiceEmitResponse {
	/** Response from the emit, translated to Messenger form. */
	response?: MessengerResponse;
}

/** The requirements to identify a specific flow from among the services. */
export interface FlowDefinition {
	/** The ID of the service. */
	service: string;
	/** The ID of the flow. */
	flow: string;
	/** A name for this flow, if not ID. */
	alias?: string;
	/** Names that this flow has gone by before.  Used to find routes who's flowname has changed. */
	previous?: string[];
}

/** The requirements to identify a specific thread from among the services. */
export interface ThreadDefinition extends FlowDefinition {
	/** The ID of the thread. */
	thread: string;
}

/** The details required to connect a messenger, actually just passed through to sub-services. */
export interface MessengerConnectionDetails {
	/** Each key is a service that should be created, each value the details it will require. */
	[serviceName: string]: object;
}

/** The details required to create a messenger. */
export interface MessengerConstructor extends ServiceScaffoldConstructor {
	/** An object specifying how metadata should be encoded. */
	metadataConfig: MetadataConfiguration;
	/** An object containing definitions of the sub services this wraps. */
	subServices: MessengerConnectionDetails;
}

/** Defines that the events that the messenger emits will provide basic message information. */
export interface MessengerEvent extends ServiceScaffoldEvent {
	/** A massaged presentation of the data, using message types. */
	cookedEvent: BasicMessageInformation;
}

export interface SolutionIdea {
	description: string;
	fixes: string[];
}

export interface SolutionIdeas {
	[pattern: string]: SolutionIdea;
}

export interface SolutionMatrix {
	[service: string]: SolutionIdeas;
}

export interface FlowMapping {
	source: FlowDefinition;
	destination: FlowDefinition;
}
