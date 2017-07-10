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
import { ServiceAPIHandle } from './service-types';
import { UtilityEmitContext, UtilityEndpointDefinition, UtilityWorkerData } from './service-utilities-types';

export type FrontEmitMethod = (payload?: RequestData) => Promise<ResponseData|Status|void|ConversationComments>;

export interface FrontEndpointDefinition extends UtilityEndpointDefinition {
	objectType: string;
	action: string;
}
export interface FrontEmitContext extends UtilityEmitContext {
	endpoint: FrontEndpointDefinition;
	payload: RequestData;
}
export interface FrontHandle extends ServiceAPIHandle {
	front: Front;
}
export interface FrontConnectionDetails {
	token: string;
}
export interface FrontWorkerData extends UtilityWorkerData {
}
