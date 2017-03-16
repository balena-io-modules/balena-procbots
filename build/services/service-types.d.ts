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
import { WorkerMethod } from '../framework/worker';

// A Service is either a Listener or an Emitter.
export type ServiceType = 'listener' | 'emitter';

// The source is the name of the event service (in the case of an Listener) or the
// client (in the case of an Emitter).
export interface ServiceData {
    source: string;
}

// Cooked event data is data that has been transformed by a Listener service to
// include specific information related to that service in a form a client can use.
// Raw data is the raw event received by the Listener from the service.
export interface ServiceEvent extends ServiceData {
    cookedEvent: any;
    rawEvent: any;
}

// Specifies one or more specific contexts based on services.
export interface ServiceEmitContext {
    [name: string]: any;
}

// The EmitRequest takes one or more Emitter specific context to allow any Emitter
// that can support the context to use it to send data.
export interface ServiceEmitRequest extends ServiceData {
    // An array of data contexts. The contexts include specific
    // data types for the emitter required.
    // The emitter itself must validate data coming in.
    contexts: ServiceEmitContext;
}

export interface ServiceEmitResponse extends ServiceData {
    response?: any;
    err?: Error;
}

// Used by a client to register for particular events on a service.
// This can be extended by a service to pass more meaningful information (and to filter events).
export interface ServiceRegistration {
    name: string;
    events: string[];
    listenerMethod: ServiceListenerMethod;
}

// What a client of a listener implements when called. Returns any particular context.
export type ServiceListenerMethod = (registration: ServiceRegistration, event: ServiceEvent) => Promise<void>;

// A ServiceListener has a name and a method allowing a client to register interest in
// an event along with service specific details.
export interface ServiceListener {
    serviceName: string;
    registerEvent: (registration: ServiceRegistration) => void;
}

// A ServiceEmitter has a name and a `sendData()` method allowing client to send data
// that is to be sent to the relevant service.
export interface ServiceEmitter {
    serviceName: string;
    sendData: (data: ServiceEmitRequest) => Promise<ServiceEmitResponse>;
}

// The ServiceFactory object allows the creation of a ServiceListener and/or ServiceEmitter.
export interface ServiceFactory {
    createServiceListener: (data: any) => ServiceListener;
    createServiceEmitter: (data: any) => ServiceEmitter;
}
