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

import TypedError = require('typed-error');
import * as Promise from 'bluebird';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger, LogLevel } from '../utils/logger';
import {
	ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse,
	ServiceEmitter, ServiceListener, ServiceRegistration,
} from './service-types';
import {
	UtilityServiceEvent, UtilityWorkerEvent
} from './service-utilities-types';

/**
 * A utility class to handle a bunch of the repetitive work associated with being a ServiceListener and ServiceEmitter
 *
 * This class provides:
 * - An always connect then maybe listen constructor flow.
 * - An express app, if asked for.
 * - A logger.
 * - An event registration and handling standard.
 * - Checks for and extracts data from context.
 * - A standard way of getting contextualised workers.
 * - Ensure activating as a listener only gets called once.
 *
 * In exchange you agree to:
 * - provide a `connect` method to connect this class to the service, called during construction and only once.
 * - provide a `startListening` method to activate this class as a listener, calling queueEvent as required.
 * - provide a `emitData` method which takes a ServiceEmitContext and returns a promise.
 * - provide a `verify` function which should check that incoming data isn't spoofed.
 * - provide a `serviceName` getter, which because it is based on file path cannot be inherited away.
 * - provide a `apiHandle` getter, which should return the underlying object that executes the requests.
 * - enqueue your events with `context` and `event` in cookedData, as per `UtilityServiceEvent`.
 */
export abstract class ServiceUtilities extends WorkerClient<string> implements ServiceListener, ServiceEmitter {
	/** A place to put output for debug and reference. */
	private _logger = new Logger();

	/** A singleton express instance for all web-hook based services to share. */
	private _expressApp: express.Express;

	/** Store a list of actions to perform when particular actions happen */
	private eventListeners: { [event: string]: ServiceRegistration[] } = {};

	/** A boolean flag for if this object has been activated as a listener. */
	private listening: boolean = false;

	/**
	 * Build this service, specifying whether to awaken as a listener.
	 * @param data    Object containing the required details for the service.
	 * @param listen  Whether to start listening during construction.
	 */
	constructor(data: object, listen: boolean) {
		super();
		this.connect(data);
		this.logger.log(LogLevel.INFO, `---> '${this.serviceName}' connected.`);
		if (listen) {
			this.listen();
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
		try {
			const context = data.contexts[this.serviceName] as ServiceEmitContext;
			if (context) {
				return new Promise<ServiceEmitResponse>((resolve) => {
					this.emitData(context)
					.then((response) => {
						resolve({
							response,
							source: this.serviceName,
						});
					})
					.catch((err) => {
						resolve({
							err,
							source: this.serviceName,
						});
					});
				});
			} else {
				return Promise.resolve({
					err: new TypedError(`No ${this.serviceName} context`),
					source: this.serviceName,
				});
			}
		} catch(err) {
			return Promise.resolve({
				err,
				source: this.serviceName,
			});
		}
	}

	/**
	 * Queue an event ready for running in a child, here to type guard.
	 * @param data  The WorkerEvent to add to the queue for processing.
	 */
	protected queueData(data: UtilityServiceEvent) {
		if (this.verify(data)) {
			super.queueEvent({
				data,
				workerMethod: this.handleEvent
			});
		} else {
			this.logger.log(LogLevel.WARN, `Event failed verification.`);
		}
	}

	/**
	 * Connect to the service, used as part of construction.
	 * @param data  Object containing the required details for the service.
	 */
	protected abstract connect(data: any): void

	/**
	 * Emit a payload to the endpoint defined, resolving when done.
	 * endpoint  Definition of the endpoint to emit to.
	 * payload   Data to be delivered.
	 */
	protected abstract emitData(data: ServiceEmitContext): Promise<ServiceEmitResponse>;

	/** Awaken this class as a listener. */
	protected abstract startListening(): void;

	/**
	 * Verify the event before enqueueing.  A naive approach could be to simply return true, but that must be explicit.
	 * @param data  The data object that was enqueued.
	 */
	protected abstract verify(data: UtilityServiceEvent): boolean

	/**
	 * Get a Worker object for the provided event, threaded by context.
	 * @param event  Event as enqueued by the listener.
	 * @returns      Worker for the context associated.
	 */
	protected getWorker = (event: UtilityWorkerEvent): Worker<string> => {
		// Attempt to retrieve an active worker for the context
		const context = event.data.cookedEvent.context;
		const retrieved = this.workers.get(context);
		if (retrieved) {
			return retrieved;
		}
		// Create and store a worker for the context
		const created = new Worker<string>(context, this.removeWorker);
		this.workers.set(context, created);
		return created;
	}

	/**
	 * Create or retrieve the express app.
	 * @returns  Express server app.
	 */
	protected get expressApp(): express.Express {
		if (!this._expressApp) {
			// Either MESSAGE_SERVICE_PORT from environment or PORT from Heroku environment
			const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
			if (!port) {
				throw new Error('No inbound port specified for express server.');
			}
			// Create and log an express instance
			this._expressApp = express();
			this._expressApp.use(bodyParser.json());
			this._expressApp.listen(port);
			this.logger.log(LogLevel.INFO, `---> Started ProcBot shared web server on port '${port}'.`);
		}
		return this._expressApp;
	}

	/**
	 * Retrieve the logger, here to write-protect it
	 * @returns  Logger instance for this class
	 */
	protected get logger(): Logger {
		return this._logger;
	}

	/**
	 * Pass an event to registered listenerMethods.
	 * @param data  Enqueued data from the listener.
	 * @returns     Promise that resolves once the event is handled.
	 */
	protected handleEvent = (data: UtilityServiceEvent): Promise<void> => {
		// Retrieve and execute all the listener methods, squashing their responses
		const listeners = this.eventListeners[data.cookedEvent.event] || [];
		return Promise.map(listeners, (listener) => {
			return listener.listenerMethod(listener, data);
		}).return();
	}

	/** Start the object listening if it isn't already. */
	private listen = () => {
		// Ensure the code in the child object gets executed a maximum of once
		if (!this.listening) {
			this.listening = true;
			this.startListening();
			this.logger.log(LogLevel.INFO, `---> '${this.serviceName}' listening.`);
		}
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
