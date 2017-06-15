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
import { GithubError } from '../services/github';
import { GithubCookedData, GithubHandle, GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
import { AlertLevel, LogLevel } from '../utils/logger';
import * as keyframeControl from 'keyfctl';
import { Content } from '../../build/apis/githubapi-types';
import TypedError = require('typed-error');

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

class HTTPError extends TypedError {
    /** Message error from the Github API. */
    public httpCode: number;
    public type = 'HttpError';

    constructor(code: number, message: string) {
        super();

        // Attempt to parse from JSON.
        this.httpCode = code;
        this.message = message;
    }
}

type Environment = 'staging' | 'production';

interface KeyframeDetails  {
    version: string;
    environment: Environment;
}

const DeployKeyframePath = '/deploykeyframe';

const KeyframeFilename = 'keyframe.yml';

const Environments = {
    'test': 'resin-io/procbots-private-test',
    'staging': 'blah',
    'production': 'blah',
};

interface DeploymentDetails {
    keyframe: GithubApiTypes.Content;
    username: string;
    version: string;
    owner: string;
    repo: string;
    environment: string;
}

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
        return tempMkdir(`keyframebot-${repo}-${pr.number}_`).then((tempDir: string) => {
            fullPath = `${tempDir}${path.sep}`;

            return Promise.mapSeries([
                `git clone https://${authToken}:${authToken}@github.com/${owner}/${repo} ${fullPath}`,
                `git checkout ${branchName}`
            ], cliCommand);
        }).then(() => {
            // Lint the keyframe
            // For this we need the base SHA and the last commit SHA for the PR.
            const baseSha = pr.base.sha;
            const headSha = pr.head.sha;
            return keyframeControl.lint(baseSha, headSha, fullPath);
        }).then((lintResults: keyframeControl.LintResponse) => {
            let lintMessage = "Keyframe linted successfully";
            let commentPromise = Promise.resolve();

            // Change status depending on lint.
            if (!lintResults.valid) {
                lintMessage = "Keyframe linting failed";

                // We get array of arrays atm, not sure why.
                const flattenedErrors = _.flatten(lintResults.messages);
                let errorMessage = 'The following errors occurred whilst linting the `${KeyframeFilename}` file:\n';
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
        const environment = payload.environment;
        const version = payload.version;
        const headerToken = req.get('Authorization');
        let decodedToken: any;
        let owner = '';
        let repo = '';
        let deployDetails: DeploymentDetails;

        // Read the headers, validate the bearer token with the SDK.
        const tokenMatch = headerToken.match(/^token (.*)$/i);
        if (!tokenMatch) {
            res.sendStatus(400);
            return;
        }

        const token = tokenMatch[1];
        return resin.auth.loginWithToken(token).then(() => {
            try {
                decodedToken = jwtDecode(token);
            } catch(_err) {
                throw new Error('Cannot decode token into JWT object');
            }

            if (!_.includes(decodedToken.permissions, 'admin.home')) {
                // Ensure it's a 404 so anyone without rights doesn't know it exists.
                throw new HTTPError(404, 'Invalid access rights');
            }

            // We have a payload (hopefully) denoting the version of the keyframe on master to
            // deploy, and to which environment it should be deployed.

            // Get the right environment.
            const envRepo = Environments[environment];
            if (!envRepo) {
                throw new HTTPError(400, 'Passed environment does not exist');
            }

            // Prep for the environment PR.
            owner = envRepo.split('/')[0];
            repo = envRepo.split('/')[1];

            // Ensure that the version of the keyframe specified actually exists.
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    path: KeyframeFilename,
                    ref: `refs/tags/${version}`
                },
                method: this.githubApi.repos.getContent
            });
        }).then((keyframeFile: GithubApiTypes.Content) => {
            // Github API docs state a blob will *always* be encoded base64...
            if (keyframeFile.encoding !== 'base64') {
                this.logger.log(LogLevel.WARN, `Keyframe file exists for ${owner}/${repo} but is not ` +
                    `Base64 encoded! Aborting.`);
                throw new HTTPError(500, 'Keyframe was not correctly encoded');
            }

            // We now go ahead and:
            // 1. Create a new branch for this, create it from the version passed
            // 2. Commit the keyframe to that branch
            // 3. Open a new PR pointing to that branch. Any relevant reviewers can be set (when it works) from
            //    a `.procbot.yml` config in the env repo.

            // Create a new branch and commit the keyframe to it.
            deployDetails = {
                keyframe: keyframeFile,
                username: decodedToken.username,
                environment,
                version,
                owner,
                repo
            };
            return this.createNewEnvironmentBranchCommit(deployDetails);
        }).then((branchName: string) => {
            // Open a new PR using the new branch.
            // If there's a `.procbot.yml` config in the branch, it'll do setup for us.
            console.log(branchName);
            return this.createNewPRFromBranch(deployDetails);
        }).then(() => {
            // Badabing. We'll now do linting on the *environment* branch automatically, as the
            // PR will kick it off. NOTE: How do we determine which type of linting we do?
            // I guess we could look at repo, but that's a bit horrible. See if there's a variables file?
            // Talk to Jack.

            // All done.
            res.sendStatus(200);
        }).catch((err: GithubError | HTTPError) => {
            let errorCode = (err instanceof HTTPError) ? err.httpCode : 500;
            this.logger.log(LogLevel.INFO, `Error thrown in keyframe deploy:\n${err.message}`);
            res.status(errorCode).send(err.message);
        });
    }

    private createNewEnvironmentBranchCommit = (branchDetails: DeploymentDetails): Promise<string> => {
        const owner = branchDetails.owner;
        const repo = branchDetails.repo;
        const keyframe = branchDetails.keyframe;
        const environment = branchDetails.environment;
        const version = branchDetails.version;
        const user = branchDetails.username;
        const branchName = `${user}-${version}`;;
        let branchSha = '';
        let keyframeEntry: GithubApiTypes.TreeEntry | void;
        let oldTreeSha = '';
        let newTreeSha = '';

        // 1. Create a new branch.
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                owner,
                repo,
                ref: 'heads/master'
            },
            method: this.githubApi.gitdata.getReference
        }).then((reference: GithubApiTypes.Reference) => {
            // Ensure that master exists.
            if (reference.ref !== 'refs/heads/master') {
                throw new Error(`Master doesn't exist on ${owner}/${repo}`);
            }

            // Grab the reference to the head.
            const headSha = reference.object.sha;

            // Create the new branch, using the version name and user.
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    ref: `refs/heads/${branchName}`,
                    sha: headSha
                },
                method: this.githubApi.gitdata.createReference
            });
        }).then((reference: GithubApiTypes.Reference) => {
            const branchReference = reference.ref;
            branchSha = reference.object.sha;

            if (!branchReference) {
                throw new HTTPError(404, `Couldn't create the new branch for the ${environment} environment`);
            }

            // Get the tree for the branch.
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    sha: branchSha,
                },
                method: this.githubApi.gitdata.getTree
            });
        }).then((tree: GithubApiTypes.Tree) => {
            // Find the write entry in the tree for the keyframe file.
            keyframeEntry = _.find(tree.tree, (entry) => entry.path === KeyframeFilename);
            if (!keyframeEntry) {
                throw new HTTPError(404, `Couldn't find the keyframe file in the ${environment} repository`);
            }

            // Create a new blob using the keyframe data from the product repo.
            // This data is already base64 encoded, so we just use that.
            oldTreeSha = tree.sha;
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    content: keyframe.content,
                    encoding: keyframe.encoding
                },
                method: this.githubApi.gitdata.createBlob
            });
        }).then((blob: GithubApiTypes.Blob) => {
            // We've got the blob, we've got the tree entry for the previous keyframe.
            // Create a new tree that includes this data.
            if (keyframeEntry) {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        base_tree: oldTreeSha,
                        owner,
                        repo,
                        tree: [{
                            mode: keyframeEntry.mode,
                            path: keyframeEntry.path,
                            sha: blob.sha,
                            type: 'blob'
                        }]
                    },
                    method: this.githubApi.gitdata.createTree
                });
            }
        }).then((newTree: GithubApiTypes.Tree) => {
            newTreeSha = newTree.sha;

            // Get the last commit for the branch.
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    sha: branchSha
                },
                method: this.githubApi.repos.getCommit
            });
        }).then((lastCommit: GithubApiTypes.Commit) => {
            // We have new tree object, we now want to create a new commit referencing it.
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    message: `Update keyframe from product version ${version} on behalf of Resin user ${user}.`,
                    owner,
                    parents: [ lastCommit.sha ],
                    repo,
                    tree: newTreeSha
                },
                method: this.githubApi.gitdata.createCommit
            });
        }).then((commit: GithubApiTypes.Commit) => {
            // Update the branch to include the new commit SHA, so the head points to our new
            // keyframe.
            console.log(branchName);
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    force: false,
                    owner,
                    ref: `heads/${branchName}`,
                    repo,
                    sha: commit.sha
                },
                method: this.githubApi.gitdata.updateReference
            });
        }).return(branchName);
    };

    private createNewPRFromBranch = (deploymentDetails: DeploymentDetails): Promise<void> => {
        return Promise.resolve();
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
