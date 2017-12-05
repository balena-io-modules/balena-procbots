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
/* tslint:disable: max-classes-per-file */

import TypedError = require('typed-error');
import * as Promise from 'bluebird';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { RequestHandler } from 'express';
import * as _ from 'lodash';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger, LogLevel } from '../utils/logger';
import {
	ServiceScaffoldConstructor,
	ServiceScaffoldErrorCode, ServiceScaffoldEvent, ServiceScaffoldWorkerEvent
} from './service-scaffold-types';
import {
	ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse,
	ServiceEmitter, ServiceListener, ServiceRegistration,
} from './service-types';

/**
 * A TypedError that encapsulates the subtype of the error and message provided.
 */
export class ServiceScaffoldError extends TypedError {
	/** What category of thing went wrong. */
	public code: ServiceScaffoldErrorCode;

	/**
	 * @param code     Sub-type of the error.
	 * @param message  The error message, is stored in the standard location.
	 */
	constructor(code: ServiceScaffoldErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

/**
 * A scaffold class to handle a bunch of the repetitive work associated with being a ServiceListener and ServiceEmitter
 *
 * This class provides:
 * - An express app, if asked for.
 * - A logger.
 * - An event registration and handling standard.
 * - Checks for and extracts data from context.
 * - A standard way of getting contextualised workers.
 *
 * Any inheriting child must:
 * - Provide a `emitData` method which takes a ServiceEmitContext and returns a promise.
 * - Provide a `verify` function which should check that incoming data isn't spoofed.
 * - Provide a `serviceName` getter, which because it is based on file path cannot be inherited away.
 * - Provide a `apiHandle` getter, which should return the underlying object that executes the requests.
 * - Enqueue events with `context` and `event`, as per `ServiceScaffoldEvent`.
 */
export abstract class ServiceScaffold<T> extends WorkerClient<T> implements ServiceListener, ServiceEmitter {
	/** Endpoint listener that may be used to, for example, receive web hooks. */
	protected expressApp?: express.Express;

	/** A place to put output for debug and reference. */
	private loggerInstance = new Logger();

	/** Store a list of actions to perform when particular actions happen */
	private eventListeners: { [event: string]: ServiceRegistration[] } = {};

	// https://github.com/resin-io-modules/resin-procbots/issues/262
	constructor(data: ServiceScaffoldConstructor) {
		super();
		if (typeof data.server === 'number') {
			// Construction details provided a port number, so use that.
			const port = data.server;
			this.expressApp = express();
			// This passes to the inheriting class responsibility for understanding the payload structure.
			this.expressApp.use(bodyParser.text({type: '*/*'}));
			this.expressApp.listen(port);
			this.logger.log(LogLevel.INFO, `---> Created Express app on provided port ${port} for '${this.serviceName}'.`);
		} else if (data.server) {
			// Construction details provided an express.Express (only value left that's truthy), so use it.
			this.expressApp = data.server;
			this.logger.log(LogLevel.INFO, `---> Using provided Express app for '${this.serviceName}'.`);
		}
	}

	/**
	 * Store an event of interest, so that the method gets triggered appropriately.
	 * @param registration  Registration object with event trigger and other details.
	 */
	public registerEvent(registration: ServiceRegistration): void {
		// Store each event registration in an object of arrays.
		for (const event of registration.events) {
			if (!this.eventListeners[event]) {
				this.eventListeners[event] = [];
			}
			this.eventListeners[event].push(registration);
		}
	}

	/**
	 * Emit data to the service.
	 * @param data  Service Emit Request to send, if relevant.
	 * @returns     Details of the successful transmission from the service.
	 */
	public sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse> {
		// Check that the payload being emitted is relevant to this emitter.
		const context = data.contexts[this.serviceName];
		if (!context) {
			return Promise.resolve({
				err: new ServiceScaffoldError(ServiceScaffoldErrorCode.ContextAbsent, `No ${this.serviceName} context`),
				source: this.serviceName,
			});
		}

		// Emit the payload, massaging the Promise or ProcBot style result into a ProcBot style result.
		return this.emitData(context)
		.then((response: any) => {
			if (response && response.source) {
				return response;
			}
			return {
				response,
				source: this.serviceName,
			};
		})
		.catch((err: TypedError) => {
			return {
				err,
				source: this.serviceName,
			};
		});
	}

	/**
	 * Verify and enqueue an event ready for passing to a child's registered listeners.
	 * @param data  The WorkerEvent to add to the queue for processing.
	 */
	protected queueData = (data: ServiceScaffoldEvent) => {
		// Check that the event passes verification
		if (this.verify(data)) {
			// Enqueue the event
			super.queueEvent({
				data,
				// Delivering it to registered listener methods
				workerMethod: this.handleEvent
			});
		} else {
			// Since the data failed verification, it could be anything, so our most useful debug is a simple dump.
			this.logger.log(LogLevel.WARN, `Event failed verification.\n${JSON.stringify(data)}`);
		}
	}

	/**
	 * Emit a payload to the endpoint defined, resolving when done.
	 * @param data   details of the call and associated data
	 * @returns      A promise that resolves to the response
	 */
	protected abstract emitData(data: ServiceEmitContext): Promise<any>;

	/**
	 * Verify the event before enqueueing.  A naive approach could be to simply return true, but that must be explicit.
	 * @param data  The data object that was enqueued.
	 */
	protected abstract verify(data: ServiceScaffoldEvent): boolean

	/**
	 * Get a Worker object for the provided event, threaded by context.
	 * @param event  Event as enqueued by the listener.
	 * @returns      Worker for the context associated.
	 */
	protected getWorker = (event: ServiceScaffoldWorkerEvent): Worker<T> => {
		// Attempt to retrieve an active worker for the context
		const context = event.data.context;
		const retrieved = this.workers.get(context);
		if (retrieved) {
			return retrieved;
		}
		// Create and store a worker for the context
		const created = new Worker<T>(context, this.removeWorker);
		this.workers.set(context, created);
		return created;
	}

	/**
	 * Register a handler for a particular path with our express instance.
	 * @param path     Path to register for.
	 * @param handler  Method to invoke when the path is requested.
	 */
	protected registerHandler(path: string, handler: RequestHandler): void {
		if (this.expressApp) {
			this.expressApp.post(`/${path}/`, handler);
		} else {
			throw new ServiceScaffoldError(
				ServiceScaffoldErrorCode.NoExpressServer,
				'Attempted to register a handler, but no express app configured.'
			);
		}
	}

	/**
	 * Retrieve the logger, here to write-protect it
	 * @returns  Logger instance for this class
	 */
	protected get logger(): Logger {
		return this.loggerInstance;
	}

	/**
	 * Retrieve a list of the event names being listened to
	 * @returns  list of event names
	 */
	protected get eventsRegistered(): string[] {
		return _.keys(this.eventListeners);
	}

	/**
	 * Pass an event to registered listenerMethods.
	 * @param data  Enqueued data from the listener.
	 * @returns     Promise that resolves once the event is handled.
	 */
	protected handleEvent = (data: ServiceScaffoldEvent): Promise<void> => {
		// Retrieve and execute all the listener methods, squashing their responses
		const listeners: ServiceRegistration[] = _.get(this.eventListeners, data.type, []);
		return Promise.map(listeners, (listener) => {
			return listener.listenerMethod(listener, data)
			.catch((error: Error) =>
				this.logger.alert(LogLevel.WARN, `Error thrown in handler queue processing:${error}`)
			);
		}).return();
	}

	/**
	 * Get the service name, as required by the framework.
	 * @return  Name of the service.
	 */
	abstract get serviceName(): string

	/**
	 * Retrieve the SDK API instance handle for the service, should one exist.
	 * @return  Service SDK API handle or void.
	 */
	abstract get apiHandle(): ServiceAPIHandle | void;
}
