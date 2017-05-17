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

/** A Service is either a Listener or an Emitter. */
export type ServiceType = 'listener' | 'emitter';

/** The source is the name of the event service (in the case of an Listener) or the
    client (in the case of an Emitter). */
export interface ServiceData {
    /** The source (name) of the ServiceListener or ServiceEmitter. */
    source: string;
}

/**
 * Cooked event data is data that has been transformed by a Listener service to
 * include specific information related to that service in a form a client can use.
 * Raw data is the raw event received by the Listener from the service.
 */
export interface ServiceEvent extends ServiceData {
    /** The cooked data constructed by the ServiceListener. */
    cookedEvent: any;
    /** Raw data as received by the ServiceListener. */
    rawEvent: any;
}

/** Specifies one or more specific contexts based on Services. */
export interface ServiceEmitContext {
    /** A context has a string based key, but may have an `any` value. */
    [name: string]: any;
}

/**
 * The EmitRequest takes one or more Emitter specific context to allow any Emitter
 *  that can support the context to use it to send data.
 */
export interface ServiceEmitRequest extends ServiceData {
    /**
     * An array of data contexts. The contexts include specific
     * data types for the emitter required.
     * The emitter itself must validate data coming in.
     */
    contexts: ServiceEmitContext;
}

/**
 * A response from a ServiceEmitter. This can include any data that the external
 * service sent back, or may contain an error.
 */
export interface ServiceEmitResponse extends ServiceData {
    /** The response data from the external service, if any. */
    response?: any;
    /** An error returned from the external service, if any. */
    err?: Error;
}

/**
 * Used by a client to register for particular events on a service.
 * This can be extended by a service to pass more meaningful information (and to filter events).
 */
export interface ServiceRegistration {
    /** Name of the service. */
    name: string;
    /** Specific events that the ServiceListener should listen for. Any others must be ignored. */
    events: string[];
    /** The method to call when events are ready for processing. */
    listenerMethod: ServiceListenerMethod;
}

/**
 * Implemented by the client of a listener, called when events are ready for processing.
 * Returns a promise that is fulfulled when the client has finished any work.
 */
export type ServiceListenerMethod = (registration: ServiceRegistration, event: ServiceEvent) => Promise<void>;

/**
 * The ServiceAPIHandle is a set of instances of service interfaces (if any).
 * These are used to allow, for example, the calling of specifically typed methods.
 * These are intended to be handles directly to SDK instances used to make requests
 * to/from a service. Comms going through interfaces such as HTTP(S) requests are not
 * intended to return a handle.
 */
export interface ServiceAPIHandle {
    [index: string]: object;
}

/**
 * A ServiceListener has a name and a method allowing a client to register interest in
 * an event along with service specific details.
 */
export interface ServiceListener {
    /** Getter for the SDK instance handle, if any. */
    apiHandle: ServiceAPIHandle | void;
    /** Name of the ServiceListener. */
    serviceName: string;
    /**
     * Registers the request for events to be sent to a client from a ServiceListener.
     * @param registration  A ServiceRegistration object detailing the events and method to use.
     */
    registerEvent: (registration: ServiceRegistration) => void;
}

/**
 * A ServiceEmitter has a name and a `sendData()` method allowing client to send data
 * that is to be sent to the relevant service.
 */
export interface ServiceEmitter {
    /** Getter for the SDK instance handle, if any. */
    apiHandle: ServiceAPIHandle | void;
    /** Name of the ServiceEmitter. */
    serviceName: string;
    /**
     * The method by which a client sends data for the external service the ServiceEmitter represents.
     * @param data  A ServiceEmitRequest detailing the service and data to send to it.
     * @returns     A promise with the response of the emit.
     */
    sendData: (data: ServiceEmitRequest) => Promise<ServiceEmitResponse>;
}

/** The ServiceFactory object allows the creation of a ServiceListener and/or ServiceEmitter. */
export interface ServiceFactory {
    /**
     * Creates a new ServiceListener.
     * @param data  Any required data for the construction of the ServiceListener.
     * @return      A new ServiceListener instance.
     */
    createServiceListener: (data: any) => ServiceListener;
    /**
     * Creates a new ServiceEmitter.
     * @param data  Any required data for the construction of the ServiceEmitter.
     * @return      A new ServiceEmitter instance.
     */
    createServiceEmitter: (data: any) => ServiceEmitter;
}
