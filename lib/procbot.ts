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

// The ProcBot class is the parent of all Procbots.
// It currently includes the following functionality:
//  * Logging (with DEBUG, INFO, WARN levels)
//  * Alerting (with ERROR, CRITICAL levels)
//
// It is intended as a generic class for all functionality that is required
// by child bots.
import * as Promise from 'bluebird';
import * as _ from 'lodash';

// A note on coding style here.
// Exported enums and types are considered as a similar pattern to static types in
// C++. That is, we can import a module using `import * as ProcBot from `./procbot'` and
// then reference the enums/types as if these were static, eg. `thing = ProcBot.LogLevel.WARN`
// The advantage with this is it's obvious where it comes from.
// Ideally, we'd have enums protected in the class, but we don't appear to be able to do that
// in TS.

// Worker ----------------------------------------------------------------------------------

// Standard worker method type that all other bots must implement.
export type WorkerMethod = <T>(event: string, data: T) => Promise<void>;

// The RepoQueue is important. It's entirely possible we'll receive
// payloads for the same repository in a space of time that makes
// servicing them all before receiving the payload for the next
// impossible. So, we queue them.
// When fireEvent is called, it looks at the repository that
// was acted upon and adds it to the relevant queue. It then
// schedules the worker task to go through the queues until
// they're exhausted.
// A separate worker task exists for each repo queue and dies
// upon exit.

// An entry in a queue used to schedule the next worker and
// the data to work upon, for a specific repo.
interface QueueEntry {
	worker: WorkerMethod;
	event: string;
	data: any;
};

// An event passed from an extended Bot, detailing the event it
// wished to work due to, the data to work on and the method to use.
export interface BotEvent {
	event: string,
	repoData: any,
	workerMethod: WorkerMethod
};

// The worker class is created for each unique repo that is seen.
// This ensures that multiple repos can be operated on in parallel,
// but operations only occur in series for each unique repo.
class Worker {
	private repositoryName: string;
	private parentList: Worker[];
	private queue: QueueEntry[] = [];

	constructor(repoName: string, parentList: Worker[]) {
		this.repositoryName = repoName;
		this.parentList = parentList;
		this.parentList.push(this);
	}

	get repoName(): string {
		return this.repositoryName;
	}

	// Add a new event and worker method to the queue for this repo.
	addEvent(event: string, data: string, worker: WorkerMethod): void {
		this.queue.push({ event, data, worker });
		// If this is a new worker, ensure it operates.
		if (this.queue.length === 1) {
			this.runWorker();
		}
	}

	// Run as many workers as are queued. Do this atomically, in FIFO order.
	private runWorker(): void {
		// Get the next thing from the queue.
		const entry = <QueueEntry>this.queue.shift();
		const self: this = this;

		// Run worker, proceed to next worker.
		entry.worker(entry.event, entry.data)
		.then(() => {
			if (this.queue.length > 0) {
				process.nextTick(this.runWorker);
			} else {
				// Unlink ourselves from our parent list.
				self.parentList.splice(_.findIndex(self.parentList, self));
			}
		});
	}
}

// ProcBot ----------------------------------------------------------------------------------

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


export class ProcBot {
    // Defaults.
    // Log and Alert levels are taken from an envvar or set to the minimum.
    // These can be overriden by specific methods.
    protected _botname = 'Procbot';
    protected _logLevel = process.env.PROCBOT_LOG_LEVEL | LogLevel.WARN;
    protected _alertLevel = process.env.PROCBOT_ALERT_LEVEL | AlertLevel.CRITICAL;
    private workers: Worker[] = [];

    private logLevelStrings = [
        'WARNING',
        'INFO',
        'DEBUG'
    ];

    private alertLevelStrings = [
        'CRITICAL',
        'ERROR'
    ];

    // Dummy constructor ATM.
	constructor() {
        // Nada.
	}

	// Get the name of the bot.
	protected get botname() {
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
    // FIXME: Alter this to output to the correct service.
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
    //
    // If we make this contextualised, we don't need repoName which makes no sense for
    // other bots. Change repoName to context here and in the Worker class.
	protected queueEvent(event: BotEvent): void {
		if (!event.workerMethod) {
			console.log(`WorkerMethod must be passed into the Githubbot.firedEvent() method`);
			return;
		}

		// Look at the repo. If there's no repo, we can't actually do anything with this.
		if (!event.repoData) {
			console.log('Could not find a payload or a repository for the event');
			return;
		}

		// Look through all the RepoWorkers, is there one already that exists for
		// this repo?
		// If not, create a new worker.
        //
        // FIXME: Remove specific repo based stuff with 'context' which can be
        // a generic type as long as there's a relevant checker.
        // Or maybe just have it as a string.
		let entry = _.find(this.workers, (entry: Worker) => {
			if (entry.repoName === event.repoData.full_name) {
				return true;
			}

			return false;
		});

		// If no entry found, create one.
		if (!entry) {
			entry = new Worker(event.repoData.full_name, this.workers);
		}

		// Now add the event to the found/created repo worker.
		entry.addEvent(event.event, event.repoData, event.workerMethod);

		return;
	}
}