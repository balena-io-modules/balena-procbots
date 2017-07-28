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
import { ServiceEvent } from '../services/service-types';

/**
 * A method called by the Worker class to process an event.
 * @param data	The ServiceEvent to process.
 */
export type WorkerMethod = (data: ServiceEvent) => Promise<void>;

/**
 * Remove a worker from a context.
 * @param context	The context in which the Worker should be removed.
 */
export type WorkerRemove<T> = (context: T) => void;

/** An event that has fired and needs to be processed. */
export interface WorkerEvent {
	/** The data arising from the event. */
	data: ServiceEvent;
	/** The WorkerMethod to use to process the event. */
	workerMethod: WorkerMethod;
};

/** Map linking contexts to Worker instances. */
export type WorkerMap<T> = Map<T, Worker<T>>;

/**
 * The Worker class is responsible for the execution of scheduling tasks based on events.
 * Each Worker instance is bound to a context. This context could be, for example, a
 * unique Github repository, or a directory in a file system, a specific customer service
 * in a set, etc. It is also generic, and can therefore be of any type.
 * When WorkerEvents are added to an empty queue, they are processed for being worked on
 * in the next tick of event loop.
 */
export class Worker<T> {
	/** Holds the context for the Worker. */
	private _context: T;
	/** Holds the queue of events to work on. */
	private queue: WorkerEvent[] = [];
	/** Method to call when a Worker is to be removed. */
	private onDone: WorkerRemove<T>;

	/**
	 * Creates the Worker class, specifying a context and the parent Map.
	 * @param context  The context to use for hashing.
	 * @param onDone   The method to use to remove a Worker post-event processing.
	 */
	constructor(context: T, onDone: WorkerRemove<T>) {
		this._context = context;
		this.onDone = onDone;
	}

	/**
	 * Retrieve the context for the Worker.
	 * @return The context for the Worker.
	 */
	get context(): T {
		return this._context;
	}

	/**
	 * Add a new event to the Worker's event queue.
	 * @param worker  The event to add to the queue.
	 */
	public addEvent(event: WorkerEvent): void {
		this.queue.push(event);
		// If this is a new worker, ensure it operates.
		if (this.queue.length === 1) {
			this.runWorker();
		}
	}

	/**
	 * Runs the next worker in the queue, before deleting its entry. Should more entries
	 * exist it then runs those.
	 */
	private runWorker(): void {
		// Get the next thing from the queue.
		const entry = <WorkerEvent>this.queue[0];

		// Run worker, proceed to next worker.
		entry.workerMethod(entry.data)
		.then(() => {
			this.queue.shift();
			if (this.queue.length > 0) {
				this.runWorker();
			} else {
				// Unlink ourselves from our parent list.
				this.onDone(this.context);
			}
		});
	}
}
