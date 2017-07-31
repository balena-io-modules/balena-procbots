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
/* tslint:disable: max-classes-per-file */
import * as Promise from 'bluebird';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as GithubApi from 'github';
import * as jwtDecode from 'jwt-decode';
import * as keyframeControl from 'keyfctl';
import * as _ from 'lodash';
import * as path from 'path';
import { cleanup, track } from 'temp';
import * as GithubApiTypes from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { GithubError, GithubService } from '../services/github';
import { GithubCookedData, GithubHandle, GithubLogin, GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
import { BuildCommand, ExecuteCommand } from '../utils/environment';
import { AlertLevel, LogLevel } from '../utils/logger';
import TypedError = require('typed-error');
import resinSdk = require('resin-sdk');

const tempMkdir = Promise.promisify(track().mkdir);
const tempCleanup = Promise.promisify(cleanup);

/**
 * A custom HTTP error to pass back in event of deployment failure.
 */
class HTTPError extends TypedError {
	/** Name of the error. */
	public name: string;
	/** Stack trace. */
	public stack: string;
	/** Message error from HTTP. */
	public message: string;
	/** HTTP error code. */
	public httpCode: number;
	/** Type of the error, to distinguish it from GithubError. */
	public type = 'HttpError';

	/**
	 * Constructs a new HTTP error.
	 * @param code     HTTP code to set.
	 * @param message  Message to send back as reason error occurred.
	 */
	constructor(code: number, message: string) {
		super();

		// Attempt to parse from JSON.
		this.httpCode = code;
		this.message = message;
	}
}

/**
 * Details a keyframe for deployment,
 */
interface KeyframeDetails  {
	/** Version of the keyframe. */
	version: string;
	/** The environment in which to deploy the keyframe. */
	environment: string;
}

/** Port on which the Github ServiceListener will listen. */
const GithubPort = 7788;
/** Endpoint for deployment service. */
const DeployKeyframePath = '/deploykeyframe';
/** Port for deployment service. */
const DeployKeyframePort = 7789;
/** Standard name of a keyframe. */
const KeyframeFilename = 'keyframe.yml';

/** Environments interface matching names to repositories. */
interface Environments {
	[index: string]: string;
}

/**
 * Deployment interface for passing to helper methods.
 */
interface DeploymentDetails {
	/** Keyframe body. */
	keyframe: GithubApiTypes.Content;
	/** Resin admin username. */
	username: string;
	/** Version of the keyframe. */
	version: string;
	/** Owner of the environment repository. */
	owner: string;
	/** Environment repository name. */
	repo: string;
	/** Environment name (eg. 'testing') */
	environment: string;
}

/**
 * Constructor for the KeyframeBot.
 */
export interface KeyframeBotConstructor {
	/** Github App id. */
	integrationId: string;
	/** PEM for requesting data from Github ServiceEmitter. */
	pem: string;
	/** Secret webhook for receiving data from Github ServiceListener. */
	webhookSecret: string;
	/** The repo where product keyframes are stored. */
	productRepo: string;
	/** The valid environments. JSON of form { "environment": "repo", ... } */
	environments: string;
}

// KeyframeBot listens for PullRequest and PullRequestReview events on both product
// and environment repositories. The general flow is:
// 1. User creates a PR to update the product keyframe.
// 2. KeyframeBot lints the PR to ensure the keyframe is valid. It sets a status
//    on the PR (pass/fail), along with an error if one exists.
// 3. Usual PR flow is carried out, and eventually keyframe is merged to `master`.
// 4. At some future point, a user requests that the keyframe is deployed to an environment.
//    KeyframeBot runs an HTTP service that allows a user who is also a resin.io admin
//    (ie. most engineers), to request this. They can do so by sending a payload of:
//    '{ environment: <string>, version: <string> }' to it, along with their resin.io user token:
//
//    curl -XPOST http://<server>:7789/deploykeyframe -H 'Authorization: token <blah>' \
//    -H 'Content-Type: application/json' -d '{"version": "v4.4.0", "environment": "test"}'
// 5. If the version is valid, and the user is confirmed as a resin.io admin, then a new branch
//    in the given environment is created based off `master`, and the keyframe is committed to it.
//    (Branches are named `<user>-<keyframeVersion>`).
// 6. Finally, a new PR is created in the environment repository, ready for review.
//
// TBD:
//  - Test deployment on opening/update of environment PR to create a status check.
//  - Extended linting of keyframes along with variables in an environment PR
//  - Label for saying 'Deploy to environment', which will:
//    * Carry out deploy to the correct environment from the PR
//    * On succesful deploy, kick VersionBot to merge the PR to `master`
export class KeyframeBot extends ProcBot {
	/** Github ServiceListener name. */
	private githubListenerName: string;
	/** Github ServiceEmitter. */
	private githubEmitter: GithubService;
	/** Github ServiceEmitter name. */
	private githubEmitterName: string;
	/** Instance of Github SDK API in use. */
	private githubApi: GithubApi;
	/** Instance of express. */
	private expressApp: express.Application;
	/** Environments available. */
	private environments: Environments;
	/** Product repo. */
	private productRepo: string;

	/**
	 * Constructor for the KeyframeBot.
	 *
	 * @param name         Name of the KeyframeBot.
	 * @param constObject  Constructor object.
	 */
	constructor(name: string, constObject: KeyframeBotConstructor) {
		// This is the KeyframeBot.
		super(name);

		const integrationId = constObject.integrationId;
		const pemString = constObject.pem;
		const webhook = constObject.webhookSecret;
		const environments = constObject.environments;

		// Create a new listener for Github with the right Integration ID.
		const ghListener = this.addServiceListener('github', {
			client: name,
			loginType: {
				integrationId,
				pem: pemString,
				type: GithubLogin.App
			},
			path: '/keyframehooks',
			port: GithubPort,
			type: 'listener',
			webhookSecret: webhook
		});

		// Create a new emitter with the right Integration ID.
		const ghEmitter = this.addServiceEmitter('github', {
			loginType: {
				integrationId,
				pem: pemString,
				type: GithubLogin.App
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
		this.githubEmitter = <GithubService>ghEmitter;
		this.githubListenerName = ghListener.serviceName;
		this.githubEmitterName = ghEmitter.serviceName;

		// Github API handle
		this.githubApi = (<GithubHandle>ghEmitter.apiHandle).github;
		if (!this.githubApi) {
			throw new Error('No Github API instance found');
		}

		// Parse our environments.
		try {
			this.environments = JSON.parse(constObject.environments);
		} catch (err) {
			throw new Error('There are no valid environments to use');
		}
		this.logger.log(LogLevel.INFO, `---> ${name}: Aware of the following environments: ${environments}`);

		// Get the product repo.
		this.productRepo = constObject.productRepo;

		// Create a new endpoint to allow keyframes to be promoted to a particular environment.
		// New Express app. We'll reuse it in the GH SL.
		this.expressApp = express();
		if (!this.expressApp) {
			throw new Error("Couldn't create an Express application");
		}

		// Add body parser.
		this.expressApp.use(bodyParser.urlencoded({ extended: true }));
		this.expressApp.use(bodyParser.json());
		this.expressApp.post(DeployKeyframePath, this.deployKeyframe);

		// Listen.
		this.expressApp.listen(DeployKeyframePort, () => {
			this.logger.log(LogLevel.INFO, `---> ${name}: Listening on ${DeployKeyframePort}`);
		});

		// We have two different WorkerMethods here:
		// 1) Status checks on PR open and commits
		// 2) PR review and label checks for merge
		_.forEach([
			{
				events: [ 'pull_request', 'pull_request_review' ],
				listenerMethod: this.lintKeyframe,
				name: 'LintKeyframe',
			},
		], (reg: GithubRegistration) => {
			ghListener.registerEvent(reg);
		});
	}

	/**
	 * Lints a keyframe when the Github ServiceListener sees a PR open or synchronised.
	 *
	 * @param _registration Registration object for the event.
	 * @param event  The Github event.
	 * @returns      Void Promise fulfilled when the method has finished processing the event.
	 */
	protected lintKeyframe = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
		const cookedEvent: GithubCookedData = event.cookedEvent;
		const pr: GithubApiTypes.PullRequest = cookedEvent.data.pull_request;
		const head = cookedEvent.data.pull_request.head;
		const owner = head.repo.owner.login;
		const repo = head.repo.name;
		const prNumber = pr.number;
		let branchName = pr.head.ref;
		let authToken: string;
		let fullPath = '';

		// Ensure we only lint on an open and a synchronise.
		if ((event.cookedEvent.data.action !== 'opened') && (event.cookedEvent.data.action !== 'synchronize')) {
			return Promise.resolve();
		}

		this.logger.log(LogLevel.INFO, `Linting ${owner}/${repo}#${prNumber} keyframe for issues`);

		// Ensure that there's actually a keyframe in the PR. If there isn't, we don't
		// even bother cloning for a lint.
		return this.dispatchToEmitter(this.githubEmitterName, {
			data: {
				owner,
				repo,
				path: 'keyframe.yml'
			},
			method: this.githubApi.repos.getContent
		}).then(() => {
			// Successful path get means the file exists.
			authToken = this.githubEmitter.authenticationToken;

			// Create a new temporary directory for the repo holding the keyframe.
			return tempMkdir(`keyframebot-${repo}-${pr.number}_`);
		}).then((tempDir: string) => {
			fullPath = `${tempDir}${path.sep}`;

			return Promise.mapSeries([
				BuildCommand('git', ['clone', `https://${authToken}:${authToken}@github.com/${owner}/${repo}`,
					fullPath],
					{ cwd: fullPath, retries: 3 }),
				BuildCommand('git', ['checkout', branchName], { cwd: fullPath })
			], ExecuteCommand);
		}).then(() => {
			// Lint the keyframe
			// For this we need the base SHA and the last commit SHA for the PR.
			const baseSha = pr.base.sha;
			const headSha = pr.head.sha;
			return keyframeControl.lint(baseSha, headSha, fullPath);
		}).then((lintResults: keyframeControl.LintResponse) => {
			let lintMessage = 'Keyframe linted successfully';
			let commentPromise = Promise.resolve();

			// Change status depending on lint.
			if (!lintResults.valid) {
				lintMessage = 'Keyframe linting failed';

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
		}).catch((error: Error) => {
			// Generic 'could not lint the PR' error.
			this.dispatchToEmitter(this.githubEmitterName, {
				data: {
					body: 'Unable to lint keyframe for this PR.',
					number: prNumber,
					owner,
					repo
				},
				method: this.githubApi.issues.createComment
			});
			this.reportError(error);
		}).finally(tempCleanup);
	}

	/**
	 * Deployment route method, hanging off an Express server.
	 * When a valid keyframe version and environment is passed, this will verify the product keyframe,
	 * and then create a new branch in the environment. The keyframe will be committed to this branch
	 * and a new PR will be based off it. This will automatically be linted by the process.
	 *
	 * @param req  The HTTP request.
	 * @param res  The HTTP response.
	 */
	private deployKeyframe = (req: express.Request, res: express.Response): void => {
		const payload: KeyframeDetails = req.body;
		const environment = payload.environment;
		const version = payload.version;
		const headerToken = req.get('Authorization') || '';
		const productSplitRepo = this.productRepo.split('/');
		const productOwner = productSplitRepo[0];
		const productRepo = productSplitRepo[1];
		const resin = resinSdk();

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
		resin.auth.loginWithToken(token).then(() => {
			try {
				decodedToken = jwtDecode(token);
			} catch (_err) {
				throw new Error('Cannot decode token into JWT object');
			}

			if (!_.includes(decodedToken.permissions, 'admin.home')) {
				// Ensure it's a 401 so anyone without rights doesn't know it exists,
				// and use the same message as an invalid token.
				throw new HTTPError(401, 'The token is invalid');
			}

			// Get the right environment.
			const envRepo = this.environments[environment];
			if (!envRepo) {
				throw new HTTPError(404, 'Passed environment does not exist');
			}

			// Prep for the environment PR.
			const splitRepo = envRepo.split('/');
			owner = splitRepo[0];
			repo = splitRepo[1];

			// Ensure that the version of the keyframe specified actually exists.
			// If the keyframe version doesn't exist, then Github will respond
			// that the tag doesn't exist. This will get thrown as an error, which
			// gets passed back to the user.
			// Because of this, we don't need to explicitly catch/set one here.
			return this.dispatchToEmitter(this.githubEmitterName, {
				data: {
					owner: productOwner,
					repo: productRepo,
					path: KeyframeFilename,
					ref: `refs/tags/${version}`
				},
				method: this.githubApi.repos.getContent
			});
		}).then((keyframeFile: GithubApiTypes.Content) => {
			// Github API docs state a blob will *always* be encoded base64...
			if (keyframeFile.encoding !== 'base64') {
				this.logger.log(LogLevel.WARN, `Keyframe file exists for ${productOwner}/${productRepo} but is not ` +
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
			return this.dispatchToEmitter(this.githubEmitterName, {
				data: {
					owner,
					repo,
					title: `Merge product keyframe ${deployDetails.version} into ${deployDetails.environment}`,
					body: `PR was created via a deployment of the keyframe by Resin admin ${deployDetails.username}.`,
					head: branchName,
					base: 'master'
				},
				method: this.githubApi.pullRequests.create
			});
		}).then(() => {
			// Badabing. We'll now do linting on the *environment* branch automatically, as the
			// PR will kick it off. NOTE: How do we determine which type of linting we do?
			// I guess we could look at repo, but that's a bit horrible. See if there's a variables file?
			// Talk to Jack.
			res.sendStatus(200);
		}).catch((err: GithubError | HTTPError | Error) => {
			let errorCode = (err instanceof HTTPError) ? err.httpCode : 500;
			this.reportError(err);
			res.status(errorCode).send(err.message);
		});
	}

	/**
	 * Creates a new branch on the specified environment for a given keyframe.
	 *
	 * @param branchDetails  The details of the keyframe, user and version.
	 * @returns              A string naming the branch created on fulfilment.
	 */
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
		let commitSha = '';
		const existsMessage = `The branch ${branchName} already exists on the ${environment} environment ` +
			`(${owner}/${repo})`;

		// Ensure that the branch we're about to create doesn't already exist.
		return this.dispatchToEmitter(this.githubEmitterName, {
			data: {
				owner,
				repo,
				ref: `heads/${branchName}`
			},
			method: this.githubApi.gitdata.getReference
		}).then(() => {
			throw new HTTPError(409, existsMessage);
		}).catch((err: GithubError) => {
			// Not Found is what we want to hit, else throw a new error.
			if (err.message !== 'Not Found') {
				if (err.message === existsMessage) {
					throw err;
				}

				throw new HTTPError(409, `Couldn't determine whether a branch could be created for the ` +
					`${environment} environment (${owner}/${repo})`);
			}

			// Now we can create a new branch.
			return this.dispatchToEmitter(this.githubEmitterName, {
				data: {
					owner,
					repo,
					ref: 'heads/master'
				},
				method: this.githubApi.gitdata.getReference
			});
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
				// 500 as we probably have no idea why, at this point.
				throw new HTTPError(500, `Couldn't create the new branch for the ${environment} environment`);
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
			// Find the right entry in the tree for the keyframe file.
			keyframeEntry = _.find(tree.tree, (entry) => entry.path === KeyframeFilename);
			if (!keyframeEntry) {
				// Delete the reference we just created.
				return this.dispatchToEmitter(this.githubEmitterName, {
					data: {
						owner,
						repo,
						ref: `heads/${branchName}`
					},
					method: this.githubApi.gitdata.deleteReference
				}).then(() => {
					throw new HTTPError(404, `Couldn't find the keyframe file in the ` +
						`${environment}(${owner}/${repo}) environment`);
				});
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
					message: `Update keyframe from product version ${version} on behalf of Resin admin ${user}.`,
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
			commitSha = commit.sha;
			return this.dispatchToEmitter(this.githubEmitterName, {
				data: {
					force: false,
					owner,
					ref: `heads/${branchName}`,
					repo,
					sha: commitSha
				},
				method: this.githubApi.gitdata.updateReference
			});
		}).then(() => {
			return this.dispatchToEmitter(this.githubEmitterName, {
				data: {
					message: version,
					object: commitSha,
					owner,
					repo,
					tag: version,
					tagger: {
						name: process.env.KEYFRAMEBOT_NAME,
						email: 'keyframebot@resin.io'
					},
					type: 'commit'
				},
				method: this.githubApi.gitdata.createTag
			});
		}).then((newTag: GithubApiTypes.Tag) => {
			// Finally tag this with the version of the keyframe.
			return this.dispatchToEmitter(this.githubEmitterName, {
				data: {
					owner,
					ref: `refs/tags/${version}`,
					repo,
					sha: newTag.sha
				},
				method: this.githubApi.gitdata.createReference
			});
		}).return(branchName);
	}

	/**
	 * Reports an error to the console.
	 *
	 * @param error  The error to report.
	 */
	private reportError(error: GithubError | HTTPError | Error): void {
		// Log to console.
		this.logger.alert(AlertLevel.ERROR, error.message);
	}
}

/** Creates a new instance of the KeyframeBot client. */
export function createBot(): KeyframeBot {
	if (!(process.env.KEYFRAMEBOT_NAME && process.env.KEYFRAMEBOT_INTEGRATION_ID &&
	process.env.KEYFRAMEBOT_PEM && process.env.KEYFRAMEBOT_WEBHOOK_SECRET && process.env.KEYFRAMEBOT_PRODUCT_REPO &&
	process.env.KEYFRAMEBOT_ENVIRONMENTS)) {
		throw new Error(`'KEYFRAMEBOT_NAME', 'KEYFRAMEBOT_INTEGRATION_ID', 'KEYFRAMEBOT_PEM', ` +
			`'KEYFRAMEBOT_WEBHOOK_SECRET', 'KEYFRAMEBOT_ENVIRONMENTS' and 'KEYFRAMEBOT_PRODUCT_REPO' environment ` +
			'variables need setting');
	}

	return new KeyframeBot(process.env.KEYFRAMEBOT_NAME, {
		integrationId: process.env.KEYFRAMEBOT_INTEGRATION_ID,
		pem: process.env.KEYFRAMEBOT_PEM,
		webhookSecret: process.env.KEYFRAMEBOT_WEBHOOK_SECRET,
		productRepo: process.env.KEYFRAMEBOT_PRODUCT_REPO,
		environments: process.env.KEYFRAMEBOT_ENVIRONMENTS
	});
}
