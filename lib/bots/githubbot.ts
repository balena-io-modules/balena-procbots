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
import * as GithubApi from 'github';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as request from 'request-promise';
import * as GithubApiTypes from './githubapi-types';
import { GithubAction, GithubActionRegister } from './githubbot-types';
import * as ProcBot from './procbot';
import * as Worker from './worker';

// GithubBot implementation.
export class GithubBot extends ProcBot.ProcBot<string> {
    protected githubApi: any;
    private integrationId: number;
    private eventTriggers: GithubActionRegister[] = [];
    protected authToken: string;

    // Takes a set of webhook types that the bot is interested in.
    // Registrations can be passed in on bot creation, or registered/deregistered later.
    // However, 'baked in' registrations are not available for deregistration.
    constructor(integration: number, name?: string) {
        super(name);
        this.integrationId = integration;

        // The getWorker method is an overload for generic context types.
        // In the case of the GithubBot, it's the name of the repo (a string).
        this.getWorker = (event: Worker.WorkerEvent): Worker.Worker<string> => {
            const context = event.data.repository.full_name;
            let worker: Worker.Worker<string> | undefined = this.workers.get(context);

            // If we already have a worker for this context (the repo name), return it.
            if (worker) {
                return worker;
            }

            // Create new Worker using the repo name as context.
            // We currently just use Procbot's removal method.
            worker = new Worker.Worker(context, this.removeWorker);

            // Note that workers are self-regualting; that is, they will remove themselves
            // from the Map once there are no more queued tasks.
            this.workers.set(context, worker);

            return worker;
        };

        // The `github` module is a bit behind the preview API. We may have to override
        // some of the methods here (PR review comments for a start).
        this.githubApi = new GithubApi({
            Promise: <any>Promise,
            headers: {
                // This is the current voodoo to allow all API calls to succeed.
                Accept: 'application/vnd.github.black-cat-preview+json'
            },
            host: 'api.github.com',
            protocol: 'https',
            timeout: 5000
        });
    }

    // FiredEvent needs to be called for any derived child bot (and usually it doesn't need
    // to be implemented by them if all that's required is direct Github action handling).
    // Override if any sort of check or state is required in the child (state not advised!).
    public firedEvent(event: string, repoEvent: any) {
        // Push this directly onto the queue.
        this.queueEvent({
            event,
            data: repoEvent,
            workerMethod: this.handleGithubEvent
        });
    }

    // Create a new event triggered action for the list. We don't check signatures, so someone
    // could potentially register twice. If they do that, they get called twice.
    // Currently we do not allow deregistering. Potentially there may be a need in the future,
    // but any created bot has to have actions 'baked in' atm.
    protected registerAction(action: GithubActionRegister) {
        this.eventTriggers.push(action);
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
                        number: data.issue.number,
                        repo: data.repository
                    };

                case 'pull_request':
                case 'pull_request_review':
                case 'pull_request_review_comment':
                    return {
                        number: data.pull_request.number,
                        repo: data.repository
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
                        number: labelEvent.number,
                        owner: labelEvent.repo.owner.login,
                        repo: labelEvent.repo.name
                    });

                }
                labelPromise.then((labels: any[] | void) => {
                    // If there are some labels, then we process them.
                    if (labels) {
                        const foundLabels: string[] = labels.map((label: any) => {
                            return label.name;
                        });

                        // First, are all the suppression labels present?
                        if (action.suppressionLabels &&
                            (_.intersection(action.suppressionLabels, foundLabels).length ===
                            action.suppressionLabels.length)) {
                            this.log(ProcBot.LogLevel.INFO,
                                `Dropping '${action.name}' as suppression labels are all present`);
                            return;
                        }
                        // Secondly, are all the trigger labels present?
                        if (action.triggerLabels &&
                            (_.intersection(action.triggerLabels, foundLabels).length !==
                            action.triggerLabels.length)) {
                            this.log(ProcBot.LogLevel.INFO,
                                `Dropping '${action.name}' as not all trigger labels are present`);
                            return;
                        }
                    }

                    return action.workerMethod(<GithubAction>action, data);
                }).catch((err: Error) => {
                    // We log the error, so that it's saved and matches up with any Alert.
                    this.alert(ProcBot.AlertLevel.ERROR, 'Error thrown in main event/label filter loop:' +
                        err.message);
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
            exp: Math.floor((Date.now() / 1000)) + (10 * 60),
            iat: Math.floor((Date.now() / 1000)),
            iss: this.integrationId
        };
        const jwToken = jwt.sign(payload, privatePem, { algorithm: 'RS256' });
        const installationsOpts = {
            headers: {
                'Accept': 'application/vnd.github.machine-man-preview+json',
                'Authorization': `Bearer ${jwToken}`,
                'User-Agent': 'request'
            },
            json: true,
            url: 'https://api.github.com/integration/installations'
        };

        return request.get(installationsOpts).then((installations) => {
            // Get the URL for the token.
            const tokenUrl = installations[0].access_tokens_url;

            // Request new token.
            const tokenOpts: any = {
                headers: {
                    'Accept': 'application/vnd.github.machine-man-preview+json',
                    'Authorization': `Bearer ${jwToken}`,
                    'User-Agent': 'request'
                },
                json: true,
                method: 'POST',
                url: tokenUrl
            };

            return request.post(tokenOpts);
        }).then((tokenDetails) => {
            // We also need to take into account the expiry date, which will require a new kickoff.
            this.authToken = tokenDetails.token;
            this.githubApi.authenticate({
                token: this.authToken,
                type: 'token'
            });


            // For debug.
            this.log(ProcBot.LogLevel.DEBUG, `token for manual fiddling is: ${tokenDetails.token}`);
            this.log(ProcBot.LogLevel.DEBUG, `token expires at: ${tokenDetails.expires_at}`);
            this.log(ProcBot.LogLevel.DEBUG, 'Base curl command:');
            this.log(ProcBot.LogLevel.DEBUG,
                `curl -XGET -H "Authorisation: token ${tokenDetails.token}" ` +
                `-H "Accept: application/vnd.github.black-cat-preview+json" https://api.github.com/`);
        });
    }

    // Make a 'github' API call. We explicitly wrap this so that any authentication error
    // can result in re-authentication before moving on.
    protected gitCall = (method: any, options: any, retries?: number): Promise<any> => {
        let badCreds = false;
        let retriesLeft = retries || 5;

        // We need a new Promise here, as we might need to do retries.
        return new Promise((resolve, reject) => {
            const runApi = () => {
                retriesLeft -= 1;

                // Run the method.
                method(options).then(resolve).catch((err: Error) => {
                    // Error message is actually JSON.
                    const ghError: GithubApiTypes.GithubError = JSON.parse(err.message);
                    if (retriesLeft < 1) {
                        // No more retries, just reject.
                        reject(err);
                    } else {
                        if ((ghError.message === 'Bad credentials') && !badCreds) {
                            // Re-authenticate, then try again.
                            this.authenticate().then(runApi);
                        } else {
                            // If there's more retries, try again in 5 seconds.
                            setTimeout(runApi, 5000);
                        }
                    }
                });
            };

            // Kick it off.
            runApi();
        });
    }
}
