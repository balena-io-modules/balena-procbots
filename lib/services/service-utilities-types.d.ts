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
import TypedError = require('typed-error');
import { WorkerEvent } from '../framework/worker';
import { ServiceEmitContext, ServiceEvent } from './service-types';

/** Function skeleton that is used to empower serviceUtility to assume a single argument and a Promise resolution */
export type UtilityEmitMethod = (payload?: object) => Promise<any>;

/** Data object the ensures the existence of context and event for serviceUtilities. */
export interface UtilityWorkerData extends ServiceEvent {
	cookedEvent: {
		context: string;
		event: string;
		[key: string]: any;
	};
}

/** Incoming event object that guarantees some details about the data for serviceUtilities generic handling. */
export interface UtilityWorkerEvent extends WorkerEvent {
	data: UtilityWorkerData;
}

/** Outgoing event object that guarantees an endpoint definition and payload for serviceUtilities. */
export interface UtilityEmitContext extends ServiceEmitContext {
	endpoint: UtilityEndpointDefinition;
	passThrough?: UtilityData;
	payload?: UtilityData;
}

/** A dumb type intended as an inheritance root. */
export interface UtilityEndpointDefinition {
	[key: string]: any;
}

/** A dumb type intended as an inheritance root. */
export interface UtilityData {
	[key: string]: any;
}
