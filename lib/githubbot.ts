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

import * as ProcBot from './procbot';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';

const GithubApi = require('github');
const hmac = require('crypto');
const githubHooks = require('github-webhook-handler');
const jwt = require('jsonwebtoken');
const request: any = Promise.promisifyAll(require('request'));

// GithubBot ---------------------------------------------------------------------------

// The GithubAction  defines an action, which is passed to a WorkerMethod should all of
// the given pre-requisites be applicable.
// At least one event. For each additional event, this is considered an 'OR' comparator.
// eg. 'pull_request' OR 'pull_request_review' event
// Labels, on the other hand, are ANDed together.
// eg. 'flow/ready-to-merge' AND 'flow/in-review' (trigger or suppression)
//
// In the future, some sort of comparator language might be useful, eg:
// and: [
//  {
//      or: [
//          {
//              name: <eventType>
//              value: 'pull_request',
//              op: eq | neq;
//          },
//          ...
//      }]
//  ,
//  ...
//  }
// ]
export interface GithubAction {
    events: string[],
    triggerLabels?: string[],
    suppressionLabels?: string[]
}

// The Register interface is passed to the GithubBot.register method to register
// for callback when the appropriate events and labels are received.
export interface GithubActionRegister extends GithubAction {
    name: string,
    workerMethod: GithubActionMethod
}

//export type GithubActionMethod = <T>(event: string, data: T) => Promise<void>;
export type GithubActionMethod = <T>(action: GithubAction, data: T) => Promise<void>;

// Main GithubBot.
export class GithubBot extends ProcBot.ProcBot<string> {
    // Github API
    private integrationId: number;
    private jwt: string;
    private user: number;
    private token: string;
    private eventTriggers: GithubActionRegister[] = [];
    protected githubApi: any;

    // Takes a set of webhook types that the bot is interested in.
    // Registrations can be passed in on bot creation, or registered/deregistered later.
    // However, 'baked in' registrations are not available for deregistration.
    constructor(integration: number) {
        super();
        this._botname = 'GithubBot';
        this.integrationId = integration;

        // The getWorker method is an overload for generic context types.
        // In the case of the GithubBot, it's the name of the repo (a string).
        this.getWorker = (event: ProcBot.BotEvent): ProcBot.Worker<string> => {
            const context = event.data.repository.full_name;
            let worker: ProcBot.Worker<string> | undefined = this.workers.get(context);

            // If we already have a worker for this context (the repo name), return it.
            if (worker) {
                return worker;
            }

            // Create new Worker using the repo name as context.
            worker = new ProcBot.Worker(context, this.workers);

            // Note that workers are self-regualting; that is, they will remove themselves
            // from the Map once there are no more queued tasks.
            this.workers.set(context, worker);

            return worker;
        };

        // The `github` module is a bit behind the preview API. We may have to override
        // some of the methods here (PR review comments for a start).
        this.githubApi = new GithubApi({
            //debug: true,
            protocol: 'https',
            host: 'api.github.com',
            headers: {
                // This is the current voodoo to allow all API calls to succeed.
                'Accept': 'application/vnd.github.black-cat-preview+json'
            },
            Promise: Promise,
            timeout: 5000
        });
    }

    // Create a new event triggered action for the list. We don't check signatures, so someone
    // could potentially register twice. If they do that, they get called twice.
    // Currently we do not allow deregistering. Potentially there may be a need in the future,
    // but currently any created bot has to have actions 'baked in'.
    protected registerAction(action: GithubActionRegister) {
        this.eventTriggers.push(action);
    }

    // FiredEvent needs to be called for any derived child bot (and in fact probably doesn't need
    // to be implemented by them if all that's required is direct Github action handling).
    // Override if any sort of check or state is required in the child (state not advised!).
    public firedEvent(event: string, repoEvent: any) {
        // Push this directly onto the queue.
        this.queueEvent({
            event: event,
            data: repoEvent,
            workerMethod: this.handleGithubEvent
        });
    }

    // Handles all Github events to trigger actions, should the parameters meet those
    // registered.
    protected handleGithubEvent = (event: string, data: any) => {
        const labelHead = () => {
            // Note that a label event itself is not in itself a labelled type,
            // so we don't check for it.
            switch (event) {
                case 'issue_comment':
                case 'issues':
                    return {
                        repo: data.repository,
                        number: data.issue.number
                    };

                case 'pull_request':
                case 'pull_request_review':
                case 'pull_request_review_comment':
                    return {
                        repo: data.repository,
                        number: data.pull_request.number
                    };

                default:
                    return;
            }
        };

        _.forEach(this.eventTriggers, (action: GithubActionRegister) => {
            // Is the event one of the type that triggers the action?
            if (_.includes(action.events, event)) {
                let labelEvent: any | void = labelHead();
                let labelPromise = Promise.resolve();

                // Are there any labels (trigger or suppression) set on the action?
                if ((action.triggerLabels || action.suppressionLabels) && labelEvent) {
                    // OK, so we've got a label event, so we now have to get all the labels
                    // for the appropriate event.
                    console.log(labelEvent);
                    labelPromise = this.gitCall(this.githubApi.issues.getIssueLabels, {
                        owner: labelEvent.repo.owner.login,
                        repo: labelEvent.repo.name,
                        number: labelEvent.number
                    })

                }
                labelPromise.then((labels: any[] | void) => {
                    // If there are some labels, then we process them.
                    if (labels) {
                        const foundLabels: string[] = labels.map((label: any) => {
                            return label.name;
                        })

                        console.log(foundLabels);
                        // First, are all the suppression labels present?
                        if (action.suppressionLabels &&
                            (_.intersection(action.suppressionLabels, foundLabels).length === action.suppressionLabels.length)) {
                            console.log(_.intersection(action.suppressionLabels, foundLabels));
                            this.log(ProcBot.LogLevel.INFO, `Dropping '${action.name}' as suppression labels are all present`)
                            return;
                        }
                        // Secondly, are all the trigger labels present?
                        if (action.triggerLabels &&
                            (_.intersection(action.triggerLabels, foundLabels).length !== action.triggerLabels.length)) {
                            this.log(ProcBot.LogLevel.INFO, `Dropping '${action.name}' as not all trigger labels are present`)
                            return;
                        }
                    }

                    return action.workerMethod(<GithubAction>action, data);
                    //return trigger.workerMethod(event, data);
                });
            }
        });

        return Promise.resolve();
    }

    // If user is passed, then the Integration is authenticating as a installation user
    protected authenticate(user?: number): Promise<void> {
        // Initialise JWTs
        const privatePem = new Buffer(process.env.PROCBOTS_PEM, 'base64').toString();

        const payload = {
            iat: Math.floor((Date.now() / 1000)),
            exp: Math.floor((Date.now() / 1000)) + (10 * 60),
            iss: this.integrationId
        };

        const jwToken = jwt.sign(payload, privatePem, { algorithm: 'RS256' });
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
            // Get the URL for the token.
            const installations: any[] = res.body;
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

            this.githubApi.authenticate({
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
    protected gitCall = (method: any, options: any, retries?: number): Promise<any> => {
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

// Create a new GithubBot.
export function createBot(): GithubBot {
    return new GithubBot(0);
}