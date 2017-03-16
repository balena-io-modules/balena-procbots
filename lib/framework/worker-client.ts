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

import { Worker, WorkerEvent, WorkerMap } from './worker';

// The WorkerClient class is extended by Service implementations to allow queueing of
// incoming events.
export class WorkerClient<T> {
    protected workers: WorkerMap<T> = new Map<T, Worker<T>>();

    // This generic method must be implemented in children extended from a ProcBot.
    // It defines the context type used for Workers.
    protected getWorker: (event: WorkerEvent) => Worker<T>;

    // Queue an event ready for running in a child.
    protected queueEvent(event: WorkerEvent): void {
        let entry: Worker<T> | undefined;

        if (!event.workerMethod) {
            return;
        }

        // If there's no data, we can't actually do anything with this.
        if (!event.data) {
            return;
        }

        // Retrieve any worker with a matching context, or create a new one.
        // Bot implementation specific.
        entry = this.getWorker(event);

        // Now add the event to the found/created repo worker.
        entry.addEvent(event);
    }

    // Remove a worker from a context post-action.
    protected removeWorker = (context: T): void => {
        this.workers.delete(context);
    }
}
