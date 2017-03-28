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
import * as bodyParser from 'body-parser';
import * as crypto from 'crypto';
import * as express from 'express';
import * as GithubApi from 'github';
import * as jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import * as path from 'path';
import * as request from 'request-promise';
import * as GithubApiTypes from '../apis/githubapi-types';
import { Worker, WorkerEvent } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { GithubConstructor, GithubEmitRequestContext, GithubIntegration,
    GithubListenerConstructor, GithubRegistration } from '../services/github-types';
import { AlertLevel, Logger, LogLevel } from '../utils/logger';
import { ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter,
    ServiceEvent, ServiceListener } from './service-types';

// Github Label details.
interface LabelDetails {
    number: string;
    repo: {
        owner: {
            login: string;
        };
        name: string;
    };
}

// The Github service allows all interaction with Github.
// It implements both a Listener that will listen to webhooks and an emitter
// that will communicate with GH via it's API.
export class GithubService extends WorkerClient<string> implements ServiceListener, ServiceEmitter {
    protected getWorker: (event: WorkerEvent) => Worker<string>;
    protected authToken: string;
    protected pem: string;
    protected githubApi: any;
    private integrationId: number;
    private eventTriggers: GithubRegistration[] = [];
    // This is the current voodoo to allow all API calls to succeed.
    // Accept: 'application/vnd.github.black-cat-preview+json' is now out of date
    private ghApiAccept = 'application/vnd.github.loki-preview+json';
    private _serviceName = path.basename(__filename.split('.')[0]);
    private logger = new Logger();

    // The constructor is passed a specific data type.
    constructor(constObj: GithubListenerConstructor | GithubConstructor) {
        super();

        // Determine type of service.
        if (constObj.loginType.type !== 'integration') {
            throw new Error('Do not yet support non-Integration type clients');
        }
        constObj.loginType = <GithubIntegration>constObj.loginType;

        // Set the Integration ID.
        this.integrationId = constObj.loginType.integrationId;
        this.pem = constObj.loginType.pem;

        // Only the listener deals with events.
        if (constObj.type === 'listener') {
            const listenerConstructor = <GithubListenerConstructor>constObj;

            // The getWorker method is an overload for generic context types.
            // In the case of the GithubBot, it's the name of the repo (a string).
            this.getWorker = (event: WorkerEvent): Worker<string> => {
                const repository = event.data.rawEvent.repository;
                let context = '';

                // If there's a repository, we use the full name as the context,
                // else we use a generic. Generic contexts can occur on events that
                // are not linked to a repo (adding/removing repo from Integration,
                // creating a user, deleting a user, etc.)
                if (repository) {
                    context = repository.full_name;
                } else {
                    context = 'generic';
                }
                let worker: Worker<string> | undefined = this.workers.get(context);

                // If we already have a worker for this context (the repo name), return it.
                if (worker) {
                    return worker;
                }

                // Create new Worker using the repo name as context.
                // We currently just use Procbot's removal method.
                worker = new Worker(context, this.removeWorker);

                // Note that workers are self-regualting; that is, they will remove themselves
                // from the Map once there are no more queued tasks.
                this.workers.set(context, worker);

                return worker;
            };

            // Verify that events being sent our way are valid and authenticated.
            function verifyWebhookToken(payload: string, hubSignature: string): boolean {
                const newHmac: any = crypto.createHmac('sha1', listenerConstructor.webhookSecret);
                newHmac.update(payload);
                if (('sha1=' + newHmac.digest('hex')) === hubSignature) {
                    return true;
                }

                return false;
            }

            // Standard Express installation.
            const app = express();
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(bodyParser.json());

            // Listen for Webhooks on the path specified by the client.
            app.post(listenerConstructor.path, (req, res) => {
                const eventType: string = req.get('x-github-event');
                const payload = req.body;

                // Ensure that the sender is authorised and uses our secret.
                if (!verifyWebhookToken(JSON.stringify(payload), req.get('x-hub-signature'))) {
                    res.sendStatus(401);
                    return;
                }

                // Let the hook get on with it.
                res.sendStatus(200);

                // Add this event into our queue.
                this.queueEvent({
                    data: {
                        cookedEvent: {
                            data: payload,
                            githubApi: this.githubApi,
                            githubAuthToken: this.authToken,
                            type: eventType
                        },
                        rawEvent: payload,
                        source: this._serviceName
                    },
                    workerMethod: this.handleGithubEvent
                });
            });

            // Listen on the specified port.
            app.listen(listenerConstructor.port, () => {
                this.logger.log(LogLevel.INFO, `---> ${listenerConstructor.client}: Listening Github Service on ` +
                    `':${listenerConstructor.port}/${listenerConstructor.path}'`);
                this.authenticate();
            });
        }

        // The `github` module is a bit behind the preview API. We may have to override
        // some of the methods here (PR review comments for a start).
        // Both the listener and the emitter need access to the API.
        this.githubApi = new GithubApi({
            Promise: <any>Promise,
            headers: {
                Accept: this.ghApiAccept
            },
            host: 'api.github.com',
            protocol: 'https',
            timeout: 5000
        });
    }

    // Create a new event triggered action for the list. We don't check signatures, so someone
    // could potentially register twice. If they do that, they get called twice.
    // Currently we do not allow deregistering. Potentially there may be a need in the future,
    // but any created bot has to have actions 'baked in' atm.
    public registerEvent(registration: GithubRegistration): void {
        this.eventTriggers.push(registration);
    }

    public sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse> {
        // Try and find the context for the Github request.
        const emitContext: ServiceEmitContext = _.pickBy(data.contexts, (_val, key) => {
            return key === this._serviceName;
        });
        const githubContext: GithubEmitRequestContext = emitContext.github;
        let retriesLeft = 3;

        // We need a new Promise here, as we might need to do retries.
        const runApi = (): Promise<ServiceEmitResponse> => {
            retriesLeft -= 1;

            // Run the method.
            return githubContext.method(githubContext.data).then((resData: any) => {
                return {
                    response: resData,
                    source: this._serviceName
                };
            }).catch((err: Error) => {
                // Sometimes the gateway can time out if we don't respond quickly enough.
                // This will destroy the ability to continue for this callset, so we exit.
                console.log(err.message);
                if (err.message.indexOf('504: Gateway Timeout') !== -1) {
                    return {
                        err: new Error('Github API timed out, could not complete'),
                        source: this._serviceName
                    };
                } else {
                    // Error message is actually JSON.
                    const ghError: GithubApiTypes.GithubError = JSON.parse(err.message);

                    // If there are no more retries, or we couldn't find the required
                    // details, reject.
                    if ((retriesLeft < 1) || (ghError.message === 'Not Found')) {
                        // No more retries, just reject.
                        return {
                            err,
                            source: this._serviceName
                        };
                    } else {
                        if (ghError.message === 'Bad credentials') {
                            // Re-authenticate, then try again.
                            return this.authenticate().then(runApi);
                        } else {
                            // If there's more retries, try again in 5 seconds.
                            return Promise.delay(5000).then(runApi);
                        }
                    }
                }
            });
        };

        return runApi();
    }

    // Get the name of this service.
    get serviceName(): string {
        return this._serviceName;
    }

    // Handles all Github events to trigger actions, should the parameters meet those
    // registered.
    protected handleGithubEvent = (event: ServiceEvent): Promise<void> => {
        // Determine the head to use based on the event.
        const labelHead = (): LabelDetails | void => {
            // Note that a label event itself is not in itself a labelled type,
            // so we don't check for it.
            switch (event.cookedEvent.type) {
                case 'issue_comment':
                case 'issues':
                    return {
                        number: event.rawEvent.issue.number,
                        repo: event.rawEvent.repository
                    };

                case 'pull_request':
                case 'pull_request_review':
                case 'pull_request_review_comment':
                    return {
                        number: event.rawEvent.pull_request.number,
                        repo: event.rawEvent.repository
                    };

                default:
                    return;
            }
        };

        return Promise.map(this.eventTriggers, (registration) => {
            // Is the event one of the type that triggers the action?
            if (_.includes(registration.events, event.cookedEvent.type)) {
                let labelEvent = labelHead();
                let labelPromise = Promise.resolve({source: this._serviceName});

                // Are there any labels (trigger or suppression) set on the action?
                if ((registration.triggerLabels || registration.suppressionLabels) && labelEvent) {
                    // OK, so we've got a label event, so we now have to get all the labels
                    // for the appropriate issue.
                    const request: ServiceEmitRequest = {
                        contexts: {},
                        source: this._serviceName
                    };
                    request.contexts[this._serviceName] = {
                        data: {
                            number: labelEvent.number,
                            owner: labelEvent.repo.owner.login,
                            repo: labelEvent.repo.name
                        },
                        method: this.githubApi.issues.getIssueLabels
                    };
                    labelPromise = this.sendData(request);
                }
                labelPromise.then((data: ServiceEmitResponse) => {
                    // If there are some labels, then we process them.
                    const labels = data.response;
                    if (labels) {
                        const foundLabels: string[] = labels.map((label: any) => {
                            return label.name;
                        });

                        // First, are all the suppression labels present?
                        if (registration.suppressionLabels &&
                            (_.intersection(registration.suppressionLabels, foundLabels).length ===
                            registration.suppressionLabels.length)) {
                            this.logger.log(LogLevel.DEBUG,
                                `Dropping '${registration.name}' as suppression labels are all present`);
                            return;
                        }
                        // Secondly, are all the trigger labels present?
                        if (registration.triggerLabels &&
                            (_.intersection(registration.triggerLabels, foundLabels).length !==
                            registration.triggerLabels.length)) {
                            this.logger.log(LogLevel.DEBUG,
                                `Dropping '${registration.name}' as not all trigger labels are present`);
                            return;
                        }
                    }

                    return registration.listenerMethod(registration, event);
                }).catch((err: Error) => {
                    // We log the error, so that it's saved and matches up with any Alert.
                    this.logger.alert(AlertLevel.ERROR, 'Error thrown in main event/label filter loop:' +
                        err.message);
                });
            }
        }).return();
    }

    // Authenticates against the Github API and Installation environment (for Integrations).
    protected authenticate(): Promise<void> {
        // Initialise JWTs
        const privatePem = new Buffer(this.pem, 'base64').toString();
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
            this.logger.log(LogLevel.INFO, `token for manual fiddling is: ${tokenDetails.token}`);
            this.logger.log(LogLevel.INFO, `token expires at: ${tokenDetails.expires_at}`);
            this.logger.log(LogLevel.INFO, 'Base curl command:');
            this.logger.log(LogLevel.INFO,
                `curl -XGET -H "Authorisation: token ${tokenDetails.token}" ` +
                `-H "Accept: ${this.ghApiAccept}" https://api.github.com/`);
        });
    }
}

// Create a new Github service Listener.
export function createServiceListener(constObj: GithubListenerConstructor): ServiceListener {
    return new GithubService(constObj);
}

// Create a new Github service Emitter.
export function createServiceEmitter(constObj: GithubConstructor): ServiceEmitter {
    return new GithubService(constObj);
}
