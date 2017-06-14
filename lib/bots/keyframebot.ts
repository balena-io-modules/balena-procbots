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
import * as ChildProcess from 'child_process';
import * as express from 'express';
import * as FS from 'fs';
import * as GithubApi from 'github';
import * as _ from 'lodash';
import * as path from 'path';
import { cleanup, track } from 'temp';
import * as GithubApiTypes from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { ProcBotConfiguration } from '../framework/procbot-types';
import { GithubCookedData, GithubHandle, GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
import { AlertLevel, LogLevel } from '../utils/logger';
import * as keyframeControl from 'keyfctl';

const resin = require('resin-sdk')();
const jwtDecode = require('jwt-decode');

const exec: (command: string, options?: any) => Promise<{}> = Promise.promisify(ChildProcess.exec);
const tempMkdir = Promise.promisify(track().mkdir);
const tempCleanup = Promise.promisify(cleanup);
const fsFileExists = Promise.promisify(FS.stat);

interface KeyframeBotError {
    brief: string;
    message: string;
    number: number;
    owner: string;
    repo: string;
}

interface FSError {
    code: string;
    message: string;
}

type Environment = 'staging' | 'production';

interface KeyframeDetails  {
    version: string;
    environment: Environment;
}

const DeployKeyframePath = '/deploykeyframe';

export class KeyframeBot extends ProcBot {
    /** Github ServiceListener. */
    private githubListenerName: string;
    /** Github ServiceEmitter. */
    private githubEmitterName: string;
    /** Instance of Github SDK API in use. */
    private githubApi: GithubApi;
    /** Instance of express. */
    private expressApp: express.Application;

    constructor(integration: number, name: string, pemString: string, webhook: string) {
        // This is the VersionBot.
        super(name);

        // New Express app. We'll reuse it in the GH SL.
        this.expressApp = express();
        if (!this.expressApp) {
            throw new Error("Couldn't create an Express application");
        }
        // Add body parser.
        this.expressApp.use(bodyParser.urlencoded({ extended: true }));
        this.expressApp.use(bodyParser.json());

        // Create a new listener for Github with the right Integration ID.
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/keyframehooks',
            port: process.env.PORT || 7788,
            type: 'listener',
            webhookSecret: webhook,
            express: this.expressApp
        });

        // Create a new emitter with the right Integration ID.
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            pem: pemString,
            type: 'emitter'
        });

        // Throw if we didn't get either of the services.
        if (!ghListener) {
            throw new Error("Couldn't create a Github listener");
        }
        if (!ghEmitter) {
            throw new Error("Couldn't create a Github emitter");
        }
        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;

        // Github API handle
        this.githubApi = (<GithubHandle>ghEmitter.apiHandle).github;
        if (!this.githubApi) {
            throw new Error('No Github API instance found');
        }

        // Create a new endpoint to allow keyframes to be promoted to a particular environment.
        this.expressApp.post(DeployKeyframePath, this.deployKeyframe);

        this.expressApp.listen(7788, () => {
            this.logger.log(LogLevel.INFO, `---> Listening on various routes on 7788`);
        });

        // We have two different WorkerMethods here:
        // 1) Status checks on PR open and commits
        // 2) PR review and label checks for merge
        _.forEach([
            {
                events: [ 'pull_request' ],
                listenerMethod: this.lintKeyframe,
                name: 'LintProductKeyframe',
            },
        ], (reg: GithubRegistration) => {
            ghListener.registerEvent(reg);
        });
    }

    protected lintKeyframe = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        const cookedEvent: GithubCookedData = event.cookedEvent;
        const pr: GithubApiTypes.PullRequest = cookedEvent.data.pull_request;
        const head = cookedEvent.data.pull_request.head;
        const owner = head.repo.owner.login;
        const repo = head.repo.name;
        const prNumber = pr.number;
        let branchName = pr.head.ref;
        const authToken = cookedEvent.githubAuthToken;
        let fullPath = '';
        const cliCommand = (command: string) => {
            return exec(command, { cwd: fullPath });
        };

        this.logger.log(LogLevel.INFO, `Linting ${owner}/${repo}#${prNumber} keyframe for issues`);

        // Create a new temporary directory for the repo holding the keyframe.
        return tempMkdir(`${repo}-${pr.number}_`).then((tempDir: string) => {
            fullPath = `${tempDir}${path.sep}`;

            return Promise.mapSeries([
                `git clone https://${authToken}:${authToken}@github.com/${owner}/${repo} ${fullPath}`,
                `git checkout ${branchName}`
            ], cliCommand);
        }).then(() => {
            // Lint the keyframe
            // For this we need the base SHA and the last commit SHA for the PR.
            const baseSHA = pr.base.sha;
            const headSHA = pr.head.sha;
            return keyframeControl.lint(baseSHA, headSHA, fullPath);
        }).then((lintResults: keyframeControl.LintResponse) => {
            let lintMessage = "Keyframe linted successfully";
            let commentPromise = Promise.resolve();

            // Change status depending on lint.
            if (!lintResults.valid) {
                lintMessage = "Keyframe linting failed";

                // We get array of arrays atm, not sure why.
                const flattenedErrors = _.flatten(lintResults.messages);
                let errorMessage = 'The following errors occurred whilst linting the `Keyframe.yml` file:\n';
                // Comment on the PR so that the author knows why the lint failed.
                _.each(flattenedErrors, (error: keyframeControl.LintError) => {
                    errorMessage += `${error.message} at line ${error.parsedLine}: ${error.snippet}\n`;
                });

                commentPromise = this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        body: errorMessage,
                        owner,
                        repo,
                        number: prNumber,
                    },
                    method: this.githubApi.issues.createComment,
                });

            }
            return commentPromise.then(() => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        context: 'KeyframeBot',
                        description: lintMessage,
                        owner,
                        repo,
                        sha: head.sha,
                        state: (lintResults.valid) ? 'success' : 'failure'
                    },
                    method: this.githubApi.repos.createStatus,
                });
            });
        }).finally(tempCleanup);
    }

    private deployKeyframe = (req: express.Request, res: express.Response): void => {
        const payload: KeyframeDetails = req.body;
        const headerToken = req.get('Authorization');
        let valid = true;

        // Read the headers, validate the bearer token with the SDK.
        const tokenMatch = headerToken.match(/^token (.*)$/i);
        if (!tokenMatch) {
            res.sendStatus(403);
            return;
        }

        const token = tokenMatch[1];
        return resin.auth.loginWithToken(token).then(() => {
            let decodedToken: any;
            try {
                decodedToken = jwtDecode(token);
            } catch(_err) {
                throw new Error('Cannot decode token into JWT object');
            }

            console.log(decodedToken);
            if (!decodedToken.permissions['admin.home']) {
                res.sendStatus(404);
                return;
            }

            // We have a payload (hopefully) denoting the version of the keyframe on master to
            // deploy, and to which environment it should be deployed.
            // We ensure both are valid.
            if (!valid) {
                // It's malformed content at this point.
                res.sendStatus(400);
                return;
            }

            // All is well, this was valid.
            res.sendStatus(200);

            // Now create a new PR on the specified environment:
            // * Create a new branch for this, create it from the version passed
            // * Commit the keyframe to that branch
            // * Open a new PR pointing to that branch, add relevant reviewers? (Procbot config in repo, I guess)

            // 1. Create a new branch.
            // Get the current head reference of the master branch.
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                },
                method: this.githubApi.gitdata.getReference
            }).then((reference: any) => {
                console.log(reference);
            });
        }).catch((err: Error) => {
            this.logger.log(LogLevel.INFO, `Error thrown in keyframe deploy:\n${err}`);
            res.sendStatus(500);
        });
    }

    /**
     * Reports an error to the console and as a Github comment..
     *
     * @param error The error to report.
     */
    private reportError(error: KeyframeBotError): void {
        // Post a comment to the relevant PR, also detailing the issue.
        this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                body: error.message,
                number: error.number,
                owner: error.owner,
                repo: error.repo
            },
            method: this.githubApi.issues.createComment
        });

        // Log to console.
        this.logger.alert(AlertLevel.ERROR, error.message);
    }
}

/**
 * Creates a new instance of the KeyframeBot client.
 */
export function createBot(): KeyframeBot {
    if (!(process.env.KEYFRAMEBOT_NAME && process.env.KEYFRAMEBOT_INTEGRATION_ID &&
    process.env.KEYFRAMEBOT_PEM && process.env.KEYFRAMEBOT_WEBHOOK_SECRET)) {
        throw new Error(`'KEYFRAMEBOT_NAME', 'KEYFRAMEBOT_INTEGRATION_ID', 'KEYFRAMEBOT_PEM' and ` +
            `'KEYFRAMEBOT_WEBHOOK_SECRET environment variables need setting`);
    }

    return new KeyframeBot(process.env.KEYFRAMEBOT_INTEGRATION_ID, process.env.KEYFRAMEBOT_NAME,
    process.env.KEYFRAMEBOT_PEM, process.env.KEYFRAMEBOT_WEBHOOK_SECRET);
}
