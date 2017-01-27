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
import * as ProcBot from './procbot';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import { AlertLevel } from './procbot';

// The GithubAPI Promise implies built-in ES6 Promises. Therefore when assigning
// the Promise to use as Bluebird, VS Code reports an error. Need a good
// fix for this that doesn't require type declarations?
const GithubApi = require('github');
const request: any = Promise.promisifyAll(require('request'));

// Github Events --------------------------------------------------------------
// These provide the current bare minimum definitions for child Procbots working with them.
export interface PullRequestEvent {
    action: string,
    pull_request: {
        number: number,
        head: {
            repo: {
                name: string;
                owner: {
                    login: string;
                }
            },
            sha: string
        }
    }
};

export interface PullRequestReviewEvent {
    action: string,
    pull_request: {
        number: number,
        head: {
            repo: {
                name: string;
                owner: {
                    login: string;
                }
            },
            sha: string
        }
    }
};


// Github API -----------------------------------------------------------------
// These provide the current bare minimum definitions for child Procbots working with them.
export interface CommitFile {
    filename: string,
};

export interface Commit {
    commit: {
        committer: {
            name: string
        }
        message: string
    },
    files: CommitFile[],
    sha: string
};

export interface Review {
    state: string
};

export interface Merge {
    sha: string
};

export interface Tag {
    sha: string
};

export interface PullRequest {
    head: {
        ref: string
    }
};

export interface Blob {
    sha: string
};

export interface TreeEntry {
    path: string,
    mode: string,
    type: string,
    sha: string,
    url?: string,
    size?: number
};

export interface Tree {
    sha: string,
    url: string,
    tree: TreeEntry[]
};

// GithubBot ------------------------------------------------------------------

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
    name: string,
    events: string[],
    triggerLabels?: string[],
    suppressionLabels?: string[]
}

// The Register interface is passed to the GithubBot.register method to register
// for callback when the appropriate events and labels are received.
export interface GithubActionRegister extends GithubAction {
    workerMethod: GithubActionMethod
}

// A GithubActionMethod is the method that will be used to process an event.
export type GithubActionMethod = <T>(action: GithubAction, data: T) => Promise<void>;

// Main GithubBot.
export class GithubBot extends ProcBot.ProcBot<string> {
    private integrationId: number;
    private user: number;
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
        this.getWorker = (event: ProcBot.WorkerEvent): ProcBot.Worker<string> => {
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
    // but any created bot has to have actions 'baked in' atm.
    protected registerAction(action: GithubActionRegister) {
        this.eventTriggers.push(action);
    }

    // FiredEvent needs to be called for any derived child bot (and usually it doesn't need
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
        // Determine the head to use based on the event.
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
                    // for the appropriate issue.
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

                        // First, are all the suppression labels present?
                        if (action.suppressionLabels &&
                            (_.intersection(action.suppressionLabels, foundLabels).length === action.suppressionLabels.length)) {
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

                    return action.workerMethod(<GithubAction>action, data).catch((err: Error) => {
                        // We log the error, so that it's saved and matches up with any Alert.
                        this.alert(ProcBot.AlertLevel.ERROR, `Error thrown: ${err.message}`);
                    });
                });
            }
        });

        return Promise.resolve();
    }

    // Authenticates against the Github API and Installation environment (for Integrations).
    protected authenticate(): Promise<void> {
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

        return request.getAsync(installationsOpts).then((res: any) => {
            // Get the URL for the token.
            const installations: any[] = res.body;
            const tokenUrl = installations[0].access_tokens_url;

            // Request new token.
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

            return request.postAsync(tokenOpts);
        }).then((res: any) => {
            // We also need to take into account the expiry date, which will require a new kickoff.
            const tokenDetails = res.body;

            this.githubApi.authenticate({
                type: 'token',
                token: tokenDetails.token
            });

            // For debug.
            this.log(ProcBot.LogLevel.DEBUG, `token for manual fiddling is: ${tokenDetails.token}`);
            this.log(ProcBot.LogLevel.DEBUG, 'Base curl command:');
            this.log(ProcBot.LogLevel.DEBUG, `curl -XGET -H "Authorisation: token ${tokenDetails.token}" -H "Accept: application/vnd.github.black-cat-preview+json" https://api.github.com/`)
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
                        return this.authenticate().then(() => {
                            return runApi();
                        });
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
                    resolve(data);
                });
            };

            // Kick it off.
            runApi();
        });
    }
}

// Create a new GithubBot. Or rather, don't.
export function createBot(): GithubBot {
    throw new Error('GithubBot is not a valid instantiation of a ProcBot');
}