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

import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';

const GithubApi = require('github');
const hmac = require('crypto');
const githubHooks = require('github-webhook-handler');
const jwt = require('jsonwebtoken');
const request: any = Promise.promisifyAll(require('request'));

// Standard worker method type that all other bots must implement.
export type RepoWorkerMethod = (event: string, data: any) => Promise<void>;

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
	event: string;
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
	addEvent(event: string, data: string, worker: RepoWorkerMethod): void {
		this.queue.push({ event, data, worker });
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

export interface GithubCall {
	owner: string,
	repo: string
};

export interface GithubPRCall extends GithubCall {
	number: number
};

class GithubAccess {
	private integrationId: number;
	private jwt: string;
	private user: number;
	private token: string;
	private _githubApi: any;

	constructor(integration: number) {
		this.integrationId = integration;

		// The `github` module is a bit behind the preview API. We may have to override
		// some of the methods here (PR review comments for a start).
		this._githubApi = new GithubApi({
			//debug: true,
			protocol: 'https',
			host: 'api.github.com',
			headers: {
				'Accept': 'application/vnd.github.black-cat-preview+json'
				// We *hope* that the above overrides all previews. As otherwise we're going to
				// have to start interleaving header media types for different calls. :-/
				//'Accept': 'application/vnd.github.machine-man-preview+json'
			},
			Promise: Promise,
			timeout: 5000
		});
	}

	public get githubApi() {
		return this._githubApi;
	}

	// If user is passed, then the Integration is authenticating as a installation user
	public authenticate(user?: number): Promise<void> {
		// Initialise JWTs
		//const privatePem = fs.readFileSync(`${__dirname}/../procbots.pem`);
		const privatePem = new Buffer(process.env.PROCBOTS_PEM, 'base64').toString();

		const payload = {
			iat: Math.floor((Date.now() / 1000)),
			exp: Math.floor((Date.now() / 1000)) + (10 * 60),
			iss: this.integrationId
		};
		console.log(payload);
		const jwToken = jwt.sign(payload, privatePem, { algorithm: 'RS256' });

		//console.log(`curl -i -XGET -H "Authorization: Bearer ${jwToken}" -H "Accept: application/vnd.github.machine-man-preview+json" https://api.github.com/integration/installations`);
		//console.log(`curl -i -XPOST -H "Authorization: Bearer ${jwToken}" -H "Accept: application/vnd.github.machine-man-preview+json" https://api.github.com/installations/5806/access_tokens`);

		const installationsOpts = {
			url: 'https://api.github.com/integration/installations',
			headers: {
				'Authorization': `Bearer ${jwToken}`,
				'Accept': 'application/vnd.github.machine-man-preview+json',
				'User-Agent': 'request'
			},
			json: true
		};

		if (user) {
			this.user = user;
		}
		return request.getAsync(installationsOpts).then((res: any) => {
			const installations: any[] = res.body;
			// Get the URL for the token.
			const tokenUrl = installations[0].access_tokens_url;

			// Request new token.
			//
			// Whilst I don't think it does, because of the way the docs are written:
			// This may need to change when more than one repo can be used by the integration.
			// What needs to happen here is each separate repository needs its own version of the
			// 'github' API so that the token matches it correctly.
			// As we have a slot for every repo in the Repo, it means that for each RepoWorker
			// we need to Authenticate. So we move this from GithubBot to RepoWorker constructor.
			// Then, every time we see a new repo we authenticate to the correct one.
			// The docs are not very clear about this.
			const tokenOpts: any = {
				url: tokenUrl,
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${jwToken}`,
					'Accept': 'application/vnd.github.machine-man-preview+json',
					'User-Agent': 'request'
				},
				json: true
			};
			if (user) {
				tokenOpts.body = { user_id: user };
			}

			return request.postAsync(tokenOpts);
		}).then((res: any) => {
			// We also need to take into account the expiry date, which will require a new kickoff.
			const tokenDetails = res.body;

			this._githubApi.authenticate({
				type: 'token',
				token: tokenDetails.token
			});

			// For debug.
			console.log(`token for manual fiddling is: ${tokenDetails.token}`);
			console.log('Base curl command:');
			console.log(`curl -XGET -H "Authorisation: token ${tokenDetails.token}" -H "Accept: application/vnd.github.black-cat-preview+json" https://api.github.com/`)
		});
	}

	// Make a 'github' API call. We explicitly wrap this so that any authentication error
	// can result in re-authentication before moving on.
	public makeCall = (method: any, options: any, retries: 6) =>{
		let badCreds = false;
		let retriesLeft: number = retries || 3;

		// We need a new Promise here, as we might need to do retries.
		return new Promise((resolve, reject) => {
			const runApi = () => {
				retriesLeft -= 1;

				// Run the method.
				return method(options).catch((err: Error) => {
					// We only try and reauthenticate once, else we throw.
					if ((err.message === 'Bad credentials') && !badCreds) {
						badCreds = true;
						// Re-authenticate, then try again.
						return runApi();
					} else if (retriesLeft === 0) {
						// No more retries, just reject.
						reject(err);
					} else {
						// If there's more retries, try again in 5 seconds.
						setTimeout(() => {
							runApi();
						}, 5000);
					}
				}).then((data: any) => {
					// Hurrah, all data back safely.
					resolve(data);
				});
			};

			// Kick it off.
			runApi();
		});
	}
}

// Main GithubBot.
export class GithubBot {
	protected _botname: string = 'GithubBot';
	protected _runsAfter: string[] = [];
	protected _github: any;
	private _webhooks: string[] = [];
	private repoWorkers: RepoWorker[] = [];

	// Takes a set of webhook types that the bot is interested in.
	constructor(webhooks: string[], integration: any) {
		this._webhooks = webhooks;
		this._github = new GithubAccess(integration);
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
		repoEntry.addEvent(event.event, event.repoData, event.workerMethod);

		return;
	}

	// Not a pure virtual, but not callable directly from GithubBot.
	public firedEvent(event: string, repoEvent: any): void {
		console.log('This method should not be called directly.');
	}
}

// Create a new GithubBot.
export function createBot(): GithubBot {
	return new GithubBot([], 0);
}