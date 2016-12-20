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

// The GithubBot is a generic class that any bot that wishes to execute
// based on Github webhooks can be extended upon.
// It deals with:
//  * Handling the scheduling of bot workers for each unique repo
//  * Adding and removing workers/events as they fire/finalise
//  * Error/Information logging to known endpoints (TBD)
//  * Dealing with order of precedence (TBD)
//
// The latter may be important for some updates back to Github,
// so we ensure that if a bot needs to be run after another,
// if that bot is also running, it's ensured that this occurs.

import Promise = require('bluebird');
import * as _ from 'lodash';

// Standard worker method type that all other bots must implement.
export type RepoWorkerMethod = (event: string) => Promise<void>;

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
interface RepoQueueEntry {
	worker: RepoWorkerMethod;
	data: any;
}

// An event passed from an extended Bot, detailing the event it
// wished to work due to, the data to work on and the method to use.
export interface RepoEvent {
	event: string,
	repoData: any,
	workerMethod: RepoWorkerMethod
}

// The worker class is created for each unique repo that is seen.
// This ensures that multiple repos can be operated on in parallel,
// but operations only occur in series for each unique repo.
class RepoWorker {
	private repositoryName: string;
	private parentList: RepoWorker[];
	private queue: RepoQueueEntry[] = [];

	constructor(repoName: string, parentList: RepoWorker[]) {
		this.repositoryName = repoName;
		this.parentList = parentList;
		this.parentList.push(this);
	}

	get repoName(): string {
		return this.repositoryName;
	}

	// Add a new event and worker method to the queue for this repo.
	addEvent(data: string, worker: RepoWorkerMethod): void {
		this.queue.push({ data: data, worker: worker });
		// If this is a new worker, ensure it operates.
		if (this.queue.length === 1) {
			this.runWorker();
		}
	}

	// Run as many workers as are queued. Do this atomically, in FIFO order.
	private runWorker(): void {
		// Get the next thing from the queue.
		const entry = <RepoQueueEntry>this.queue.shift();
		const self: this = this;

		// Run worker, proceed to next worker.
		entry.worker(entry.data)
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

// Main GithubBot.
export class GithubBot {
	protected _botname: string = 'GithubBot';
	protected _runsAfter: string[] = [];
	private _webhooks: string[] = [];
	private repoWorkers: RepoWorker[] = [];

	// Takes a set of webhook types that the bot is interested in.
	constructor(webhooks: string[]) {
		this._webhooks = webhooks;
	}

	// Get the name of the bot.
	get botname(): string {
		return this._botname;
	}

	// Get the hooks we're interested in.
	get webhooks(): string[] {
		return this._webhooks;
	}

	// TBD.
	get runsAfter(): string[] {
		return this._runsAfter;
	}

	// Queue a new event from an extended Bot.
	protected queueEvent(event: RepoEvent): void {
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
		let repoEntry = _.find(this.repoWorkers, (entry: RepoWorker) => {
			if (entry.repoName === event.repoData.full_name) {
				return true;
			}

			return false;
		});

		// If no entry found, create one.
		if (!repoEntry) {
			repoEntry = new RepoWorker(event.repoData.full_name, this.repoWorkers);
		}

		// Now add the event to the found/created repo worker.
		repoEntry.addEvent(event.repoData, event.workerMethod);

		return;
	}

	// Not a pure virtual, but not callable directly from GithubBot.
	public firedEvent(event: string, repoEvent: any): void {
		console.log('This method should not be called directly.');
	}
}

// Create a new GithubBot.
export function createBot(): GithubBot {
	return new GithubBot([]);
}