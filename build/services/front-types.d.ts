/*
Copyright 2017 Resin.io

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
import { Front, RequestData } from 'front-sdk';
import { createBot } from '../bots/notifybot';
import { ServiceAPIHandle, ServiceType } from './service-types';

export interface FrontCookedData {
    id: string;             // ID of event
    type: string;           // Type of event
    conversationId: string; // Converation ID this event relates to
    date: number;           // Epoch time
    source: any;            // Source data
    target: any;            // Target data
}

export interface FrontListenerConstructor {
    client: number;
    path: string;
    port: number;
    type: ServiceType;
    webhookSecret: string;
}

export interface FrontEmitterConstructor {
    apiKey: string;
    type: ServiceType;
}

export interface FrontHandle extends ServiceAPIHandle {
    front: Front;
}

// Emit request for Front.
export interface FrontEmitRequestContext {
    method: any;
    data: RequestData;
}
