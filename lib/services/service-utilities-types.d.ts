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

export type UtilityEmitMethod = (payload?: object) => Promise<any>;

export interface UtilityEvent extends ServiceEvent {
	cookedEvent: {
		context: string;
		event: string;
		[key: string]: any;
	};
	rawEvent: any;
	source: string;
}
export interface UtilityWorkerEvent extends WorkerEvent {
	data: UtilityEvent;
}
export interface UtilityEmitContext extends ServiceEmitContext {
	endpoint: UtilityEndpointDefinition;
	passThrough?: UtilityData;
	payload?: UtilityData;
}
export interface UtilityEndpointDefinition {
	[key: string]: any;
}
export interface UtilityData {
	[key: string]: any;
}
