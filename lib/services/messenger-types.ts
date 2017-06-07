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

import {
    WorkerEvent,
} from '../framework/worker';
import {
    ServiceEmitContext,
    ServiceEmitResponse,
    ServiceEvent,
} from './service-types';

export interface MessengerEvent extends ServiceEvent {
    cookedEvent: {
        context: string;
        type: string;
        [key: string]: any;
    };
    rawEvent: any;
    source: string;
}
export interface MessengerWorkerEvent extends WorkerEvent {
    data: MessengerEvent;
}

export enum MessengerAction {
    Create,
}

// Generic forms of message objects
export interface MessengerIds {
    user?: string;
    message?: string;
    thread?: string;
    flow?: string;
    url?: string;
}
export interface MessengerContext {
    action: MessengerAction;
    first: boolean;
    genesis: string;
    hidden: boolean;
    source: string;
    sourceIds?: MessengerIds;
    text: string;
    title?: string;
}

// Message objects suitable for the receipt of messages
export interface ReceiptIds extends MessengerIds {
    user: string;
    message: string;
    thread: string;
    flow: string;
}
export interface ReceiptContext extends MessengerContext {
    sourceIds: ReceiptIds;
}

// Message objects suitable for the handling of messages
export interface InterimIds extends MessengerIds {
    token?: string;
}
export interface InterimContext extends MessengerContext {
    sourceIds: ReceiptIds;
    to: string;
    toIds: InterimIds;
}

// Message objects suitable for the transmission of messages
export interface TransmitIds extends MessengerIds {
    user: string;
    token: string;
    flow: string;
}
export interface TransmitContext extends MessengerContext {
    sourceIds: ReceiptIds;
    to: string;
    toIds: TransmitIds;
}

export interface MessengerEmitContext extends ServiceEmitContext {
    endpoint: object;
    meta?: any;
    payload: object;
}

export interface MessengerEmitResponse extends ServiceEmitResponse {
    response?: {
        message: string;
        thread: string;
        url?: string;
    };
    err?: Error;
}

export interface Metadata {
    genesis: string | null;
    hidden: boolean;
    content: string;
}

export interface FlowDefinition {
    service: string;
    flow: string;
}

export interface DataHub {
    fetchValue(user: string, value: string): Promise<string>;
}
