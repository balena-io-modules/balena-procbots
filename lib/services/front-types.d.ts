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
import { ConversationComments, Front, RequestData, ResponseData, Status } from 'front-sdk';
import { EmitInstructions } from './messenger-types';
import { ServerDetails, ServiceScaffoldConstructor } from './service-scaffold-types';
import { ServiceAPIHandle, ServiceEmitContext, ServiceType } from './service-types';

/** Possible responses from the Front SDK */
export type FrontResponse = ResponseData|Status|void|ConversationComments;

/** Front specific subtype of the context for emission. */
export interface FrontEmitContext extends ServiceEmitContext {
	method: (data: RequestData) => Promise<any>;
	data: RequestData;
}

/** Access type for the underlying SDK. */
export interface FrontHandle extends ServiceAPIHandle {
	front: Front;
}

/**
 * Details required to initialise the Front Service.
 * This uses the existence, or otherwise, of an ingress from EndpointDetails to specify whether to listen.
 */
export interface FrontConstructor extends ServiceScaffoldConstructor {
	/** Token used to emit to the service. Gathered by an administrator. */
	token: string;
	/** Details of where to post (channel) for each inbox. */
	channelPerInbox?: {
		[inbox: string]: string;
	};
}

export interface FrontListenerConstructor extends FrontConstructor {
	/** Endpoint path to listen to. Defaults to the name of the service. */
	path?: string;
	/** Port number or server instance to listen to. */
	server: ServerDetails;
	/** Specifies that this listener must be a listener. */
	type: ServiceType.Listener;
}

/** A more specific form of emit instructions which are used to route to an API method and provide a payload. */
export interface FrontEmitInstructions extends EmitInstructions {
	payload: RequestData;
}
