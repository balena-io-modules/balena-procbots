/*
Copyright 2016 Resin.io

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
import * as _ from 'lodash';

// A note on coding style here.
// Exported enums and types are considered as a similar pattern to static types in
// C++. That is, we can import a module using `import * as ProcBot from `./procbot'` and
// then reference the enums/types as if these were static, eg. `thing = ProcBot.LogLevel.WARN`
// The advantage with this is it's obvious where it comes from.
// Ideally, we'd have enums protected in the class, but we don't appear to be able to do that
// in TS.

// Worker ---------------------------------------------------------------------

// Standard worker method type that all other bots must implement.
/**
 * A method called by the Worker class to process an event.
 * @typedef {function} WorkerMethod
 * @param {string} - The event sent.
 * @param {T} - Generic type data.
 * @param {PromiseLike<void>} - A Promise resolving once processing is complete.
 */
export type WorkerMethod = <T>(event: string, data: T) => Promise<void>;

// An event passed from a derived Bot, detailing the event it wishes to work on,
// the data to work on and the method to use for that data.
/**
 * An event that has fired and needs to be processed.
 * @typedef {Object} ProcBot.WorkerEvent
 * @property {string} event - A string denoting the event; context dependent.
 * @property {any} data - The data arising from the event.
 * @property {WorkerMethod} - The method to call that will process the event.
 */
export interface WorkerEvent {
    event: string,
    data: any,
    workerMethod: WorkerMethod
};

/**
 * A map linking contexts to Worker instances.
 * @typedef {Object} ProcBot.WorkerMap
 * @property {generic} - A generic context for the Worker.
 * @property {Worker}
 */
type WorkerMap<T> = Map<T, Worker<T>>;

/**
 * The Worker class is responsible for the execution of scheduling tasks based on events.
 * @class ProcBot.Worker
 * @classdesc
 * Each Worker instance is bound to a context. This context could be, for example, a
 * unique Github repository, or a directory in a file system, a specific customer service
 * in a set, etc. It is also generic, and can therefore be of any type.
 * When WorkerEvents are added to an empty queue, they are processed for being worked on
 * in the next tick of event loop.
 */
export class Worker<T> {
    /**
     * Holds the context for the Worker.
     * @member Worker._context
     * @private
     * @type {generic}
     */
    private _context: T;
    /**
     * Reference to the parent Map in which this Worker exists.
     * @member Worker.parentMap
     * @private
     * @type {generic}
     */
    private parentMap: WorkerMap<T>;
    /**
     * Holds the queue of events to work on.
     * @member Worker.queue
     * @private
     * @type {ProcBot.WorkerEvent[]}
     */
    private queue: WorkerEvent[] = [];

    /**
     * Creates the Worker class, specifying a context and the parent Map.
     * @param {generic} context - The context to use for hashing.
     * @param {ProcBot.WorkerMap} parentMap - The parent Map containing all Workers.
     */
    constructor(context: T, parentMap: WorkerMap<T>) {
        this._context = context;
        this.parentMap = parentMap;
    }

    /**
     * Retrieve the context for the Worker.
     * @return {generic} - The context.
     */
    get context() {
        return this._context;
    }

    /**
     * Add a new event to the Worker's event queue.
     * @param {ProcBot.WorkerEvent} worker - The event to add to the queue.
     */
    addEvent(event: WorkerEvent) {
        this.queue.push(event);
        // If this is a new worker, ensure it operates.
        if (this.queue.length === 1) {
            this.runWorker();
        }
    }

    // Run as many workers as are queued. Do this atomically, in FIFO order.
    /**
     * Runs the next worker in the queue, before deleting its entry. Should more entries
     * exist it then runs those.
     */
    private runWorker() {
        // Get the next thing from the queue.
        const entry = <WorkerEvent>this.queue.shift();
        const self: this = this;

        // Run worker, proceed to next worker.
        entry.workerMethod(entry.event, entry.data)
        .then(() => {
            if (this.queue.length > 0) {
                process.nextTick(this.runWorker);
            } else {
                // Unlink ourselves from our parent list.
                self.parentMap.delete(self.context);
            }
        });
    }
}

// ProcBot --------------------------------------------------------------------

// Logging levels are stacked, with a chosen logging level also triggering all
// levels below it; choosing a logging level of DEBUG will cause all DEBUG,
// INFO & WARN levels to be output, choosing a logging level of WARN will only cause
// WARN levels to be output.
// They are arranged this way to allow additional items to be added if required.
export enum LogLevel {
    WARN = 0,
    INFO,
    DEBUG
};

// Alerting levels are stacked, with a chosen alerting level also triggering all
// levels below it; choosing an alerting level of ERROR will cause both
// ERROR & CRITICAL output to be sent to the alert system; choosing CRITICAL will only
// output CRITICAL errors to the alert system.
// They are arranged this way to allow additional items to be added if required.
export enum AlertLevel {
    CRITICAL = 0,
    ERROR
};

// The ProcBot class is a parent class that can be used for some top-level tasks:
//  * Schedule the processing of events clustered by a given context
//  * Perform logging duties
//  * Pergorm alerting duties
export class ProcBot<T> {
    // Log and Alert levels are taken from an envvar or set to the minimum.
    // These can be overriden by specific methods.
    protected _botname = 'Procbot';
    protected _logLevel = process.env.PROCBOT_LOG_LEVEL | LogLevel.WARN;
    protected _alertLevel = process.env.PROCBOT_ALERT_LEVEL | AlertLevel.CRITICAL;
    protected workers: WorkerMap<T> = new Map<T, Worker<T>>();

    // This generic method must be implemented in children extended from a ProcBot.
    // It defines the context type used for Workers.
    protected getWorker: (event: WorkerEvent) => Worker<T>;

    // Strings prepended to logging output.
    private logLevelStrings = [
        'WARNING',
        'INFO',
        'DEBUG'
    ];

    // Strings prepended to alerting output.
    private alertLevelStrings = [
        'CRITICAL',
        'ERROR'
    ];

    // Get the name of the bot.
    public get botname() {
        return this._botname;
    }

    // Get the log level.
    protected get logLevel() {
        return this._logLevel;
    }

    // Set logLevel
    protected set logLevel(level: number) {
        this._logLevel = level;
    }

    // Get alert level.
    protected get alertLevel() {
        return this._alertLevel;
    }

    // Set logLevel
    protected set alertLevel(level: number) {
        this._alertLevel = level;
    }

    // Generic output method for either type.
    // FIXME: Alter this to output to the appropriate external service.
    private output(level: number, classLevel: number, levelStrings: Array<string>, message: string) {
        if (level >= classLevel) {
            console.log(`${levelStrings[level]} - ${message}`);
        }
    }

    // Log output.
    protected log(level: number, message: string): void {
        this.output(level, this._logLevel, this.logLevelStrings, message);
    }

    // Alert output.
    protected alert(level: number, message: string): void {
        this.output(level, this._alertLevel, this.alertLevelStrings, message);
    }

    // Queue an event ready for running in a child.
    protected queueEvent(event: WorkerEvent): void {
        let entry: Worker<T> | undefined;

        if (!event.workerMethod) {
            this.log(LogLevel.WARN, `WorkerMethod must be passed into the Githubbot.firedEvent() method`);
            return;
        }

        // Look at the repo. If there's no repo, we can't actually do anything with this.
        if (!event.data) {
            this.log(LogLevel.WARN, 'Could not find a payload for the event');
            return;
        }

        // Retrieve any worker with a matching context, or create a new one.
        // Bot implementation specific.
        entry = this.getWorker(event);

        // Now add the event to the found/created repo worker.
        entry.addEvent(event);
    }
}