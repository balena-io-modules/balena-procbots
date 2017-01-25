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

// GithubAccess ---------------------------------------------------------------------------

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

// GithubBot ---------------------------------------------------------------------------

// Main GithubBot.
export class GithubBot extends ProcBot.ProcBot<string> {
    protected _botname: string = 'GithubBot';
    protected _runsAfter: string[] = [];
    protected _github: any;
    private _webhooks: string[] = [];
    //private workers: ProcBot.Worker[] = [];

    // Takes a set of webhook types that the bot is interested in.
    constructor(webhooks: string[], integration: any) {
        super();
        this._webhooks = webhooks;
        this._github = new GithubAccess(integration);

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

        this.log(ProcBot.LogLevel.INFO, 'Construction GithubBot...');
    }

    // Get the name of the bot.
    get botname(): string {
        return this._botname;
    }

    // Get the hooks we're interested in.
    get webhooks(): string[] {
        return this._webhooks;
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