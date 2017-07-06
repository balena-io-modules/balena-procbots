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
import { Worker, WorkerEvent } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger, LogLevel } from '../utils/logger';
import {
	ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceEvent,
	ServiceListener, ServiceRegistration,
} from './service-types';

export interface UtilityEvent extends ServiceEvent {
	cookedEvent: {
		context: string;
		type: string;
		[key: string]: any;
	};
	rawEvent: any;
	source: string;
}
export interface UtilityWorkerEvent extends WorkerEvent {
	data: UtilityEvent;
}

export abstract class ServiceUtilities extends WorkerClient<string> implements ServiceListener, ServiceEmitter {
	/** A place to put output for debug and reference. */
	private _logger = new Logger();

	/** A singleton express instance for all web-hook based services to share. */
	private _expressApp: express.Express;

	/**
	 * Deliver the payload to the service. Sourcing the relevant context has already been performed.
	 * @param data  The object to be delivered to the service.
	 * @returns     Response from the service endpoint.
	 */
	protected abstract sendPayload: (data: ServiceEmitContext) => Promise<ServiceEmitResponse>;

	/** Awaken this class as a listener. */
	protected abstract activateListener: () => void;

	/** Store a list of actions to perform when particular actions happen */
	private eventListeners: { [event: string]: ServiceRegistration[] } = {};

	/** A boolean flag for if this object has been activated as a listener. */
	private listening: boolean = false;

	/**
	 * Build this service, specifying whether to awaken as a listener.
	 * @param listen  Whether to start listening during construction.
	 */
	constructor(listen: boolean) {
		super();
		if (listen) {
			// Allow the sub-constructor to set up sessions, etc, before listening
			process.nextTick(this.listen);
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
	 * Queue an event ready for running in a child.
	 * @param data  The WorkerEvent to add to the queue for processing.
	 */
	public queueEvent(data: UtilityWorkerEvent) {
		// This type guards a simple pass-through
		super.queueEvent(data);
	}

	/**
	 * Emit data to the service.
	 * @param data  Service Emit Request to send, if relevant.
	 * @returns     Details of the successful transmission from the service.
	 */
	public sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse> {
		// Check that the data has specifies a task for our emitter, before passing it on
		if (data.contexts[this.serviceName]) {
			return this.sendPayload(data.contexts[this.serviceName]);
		}
		// If this data has no task for us then no-op is the correct resolution
		return Promise.resolve({
			err: new TypedError(`No ${this.serviceName} context`),
			source: this.serviceName,
		});
	}

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
				throw new Error('No inbound port specified for express server');
			}
			// Create and log an express instance
			this._expressApp = express();
			this._expressApp.use(bodyParser.json());
			this._expressApp.listen(port);
			this.logger.log(LogLevel.INFO, `---> Started ProcBot shared web server on port '${port}'`);
		}
		return this._expressApp;
	}

	/**
	 * Retrieve the logger, here to write-protect it
	 * @returns
	 */
	protected get logger(): Logger {
		return ServiceUtilities._logger;
	}

	/**
	 * Pass an event to registered listenerMethods.
	 * @param event  Enqueued event from the listener.
	 * @returns      Promise that resolves once the event is handled.
	 */
	protected handleEvent = (event: UtilityEvent): Promise<void> => {
		// Retrieve and execute all the listener methods, squashing their responses
		const listeners = this.eventListeners[event.cookedEvent.type] || [];
		return Promise.map(listeners, (listener) => {
			return listener.listenerMethod(listener, event);
		}).return();
	}

	/** Start the object listening if it isn't already. */
	private listen = () => {
		// Ensure the code in the child object gets executed a maximum of once
		if (!this.listening) {
			this.listening = true;
			this.activateListener();
			ServiceUtilities.logger.log(LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
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
