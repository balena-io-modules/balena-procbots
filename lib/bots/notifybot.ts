/*
Copyright 2017 Resin.io

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
import { Front, TopicConversations } from 'front-sdk';
import * as GithubApi from 'github';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import { gt as semverGt } from 'resin-semver';
import TypedError = require('typed-error');
import * as GithubApiTypes from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { FrontHandle } from '../services/front-types';
import { GithubHandle, GithubLogin, GithubRegistration } from '../services/github-types';
import { ServiceEvent, ServiceType } from '../services/service-types';
import { AlertLevel, LogLevel } from '../utils/logger';

/** Interface to hold details on owner and name of a repository. */
interface RepoDetails {
	/** Owner of the repository. */
	owner: string;
	/** Name of the repository. */
	repo: string;
}

/** Contains all the information for a component deployment in an environment. */
interface DeployedPR {
	/** Name of the environment (the name of the environment repository). */
	environment: string;
	/** The full name (owner/name) of the component's respository. */
	repo: string;
	/** Version of the component the PR was deployed in. */
	version: string;
	/** Version of the component being deployed. */
	deployedVersion: string;
	/** All of the PRs associated with the deployed component version. */
	prs: string[];
	/** Whether the deployed component version is being incremented or decremented. */
	incrementing: boolean;
}

/** Holds data for retrieving a version of a specific file based on its hash. */
interface HashedFileRequest {
	/** Github API instance to use. */
	api: GithubApi;
	/** Full intra-repository path of the file to retrieve. */
	filepath: string;
	/** Hash of the file to retrieve. */
	hash: string;
	/** Owner of the repository the file exists in. */
	owner: string;
	/** Name of the repository the file exists in. */
	repo: string;
}

/** Error object for passing to notification method. */
interface NotifyBotError {
	/** A brief overview of the error. */
	brief: string;
	/** A full error message. */
	message: string;
	/** Owner of the repository that originated the message. */
	owner: string;
	/** Name of the respository that originated the message. */
	repo: string;
	/** Component version. */
	version: string;
}

/** Error codes for NotifyBot internal errors. */
enum NotifyErrorCodes {
	/** Keyframe required for retrieving component versions was missing. */
	KeyframeNotFound,
	/** Posting to the Front Conversation for an associated issue failed. */
	ConversationPostFailed,
	/** Old version of a component specified is invalid. */
	OldVersionInvalid,
	/** New version of a component specified is invalid. */
	NewVersionInvalid
}

/** Custom error to use when a failure occurs. */
class NotifyBotError extends TypedError {
	/** Name of the error. */
	public name: string;
	/** Stack trace. */
	public stack: string;
	/** Message error from HTTP. */
	public message: string;
	/** Error code. */
	public code: number;
	/** Owner of the repo. */
	public owner: string;
	/** Name of the repo. */
	public repo: string;
	/** Version of the component being operated upon. */
	public version: string;
	/** Type of the error. */
	public type = 'NotifyBotError';

	/**
	 * Constructs a new NotifyBot error.
	 * @param code     NotifyBotError code to set.
	 * @param message  Message to send back as reason error occurred.
	 */
	constructor(code: number, message: string, owner: string, repo: string, version: string) {
		super();

		// Set from parameters.
		this.code = code;
		this.message = message;
		this.owner = owner;
		this.repo = repo;
		this.version = version;
	}
}

/** Interface for storing the PRs for each version of a component. */
interface VersionPRTracker {
	[version: string]: string[];
}

/** Tracks a component from the keyframe file. */
interface ComponentTracker {
	/** Name of the component. */
	name: string;
	/** Old version (if any) of the component from previous iteration of keyframe file. */
	oldVersion: string | null;
	/** New version of component from current iteration of keyframe file. */
	newVersion: string;
	/** Full repository name of the component. */
	repo: string;
	/** Whether the version is incrementing or decrementing. */
	incrementing: boolean;
	/** All the PRs for each version of the component.  */
	versions?: VersionPRTracker;
}

/** Configuration interface for initialising NotifyBot. */
export interface NotifyBotConfig {
	/** The name of the bot. */
	botName: string;
	/** The Github App ID to use. */
	githubApp: string;
	/** The PEM for communicating with Github. */
	githubPEM: string;
	/** The secret webhook key for validating messages from Github. */
	githubSecret: string;
	/** The API key for communicating with Front. */
	frontApiKey: string;
	/** The username to use in Front comments (this should be a unique username for NotifyBot use). */
	frontUser: string;
}

/** Stores Front topic information relating to component issues for a PR. */
interface TopicIssues {
	/** A full description of each issue along with their location in the component repository. */
	relatedIssues: string[];
	/** The Front topic IDs that should be commented on for these issues. */
	topics: string[];
}

/** The port that Github attempts to send events on. */
const NotifyBotPort = 8399; // Not a listed registered port

/**
 * The RegExp to use to determine if a PR/Issue is connected to another. See the following links:
 *   * https://help.github.com/articles/closing-issues-via-commit-messages/
 *   * https://help.waffle.io/faq/waffle-workflow/use-waffles-connect-keyword-to-connect-prs-to-issues
 * Additionally, this searches for the 'Connects-To:` keyword, which is specified by the Commit/PR guidelines.
 */
const IssueRefRE = new RegExp('((?:close[sd]?|fix(?:e[sd]{1})?|resolve[sd]?):?|' +
	'connect(?:(?:s|ed)?\\s+(?:to)?:?|s-to:))\\s+(#[0-9]+)', 'gi');

/** The RegExp used to determine if an HQ issue is linked to from a component issue. */
const HqRE = /hq:\s+https:\/\/github.com\/resin-io\/hq\/issues\/([0-9]+)/gi;

/** Name of the keyframe file to search for in an environment repository. */
const KeyframeFile = 'keyframe.yml';
/** Name of the changelog file in every component repository to scan for versions. */
const ChangelogFile = 'CHANGELOG.md';
/** The virgin reference from a push, denotes that we should not work on the keyframe.  */
const VirginRef = '0000000000000000000000000000000000000000';
/** Owner of the HQ repository. */
const HqOwner = 'resin-io';
/** The HQ repository name. */
const HqRepo = 'hq';
/** Hook path for receiving GH Webhooks. */
const WebhookPath = '/notifyhooks';

/**
 * NotifyBot tracks the deployment of component versions to an environment, by comparing a pushed keyframe
 * file with its previous iteration in the environment's repository. For every component whose version has
 * altered, it gathers the PRs that were merged between the versions, and then comments on those PRs.
 *
 * Should a component's version have *incremented* in a keyframe update, then:
 *   * Every PR which has now been deployed with this version is commented upon, informing the author that
 *     the PR is now live on the specific environment the keyframe was modified in.
 *   * For every issue linked to that PR, and for any Front conversations that have been tagged in those
 *     issues, a comment is made on the Front conversation that allows an agent to report to customers that
 *     the issue/feature is now live on the specific environment.
 *     HQ issues are followed, if they have been embedded in an PR's Issue, allowing Front conversations
 *     that occur in those HQ Issues to also be commented upon.
 *
 * Should a component's version have *decremented* in a keyframe update, then:
 *   * Every PR which has now been regressed with this version is commented upon, informing the author that
 *     the PR has now been removed on the specific environment the keyframe was modified in.
 *   * For every issue linked to that PR, and for any Front conversations that have been tagged in those
 *     issues, a comment is made on the Front conversation that allows an agent to report to customers that
 *     the issue/feature is has been removed from the specific environment.
 *     HQ issues are followed, if they have been embedded in an PR's Issue, allowing Front conversations
 *     that occur in those HQ Issues to also be commented upon.
 */
export class NotifyBot extends ProcBot {
	/** Github ServiceEmitter name. */
	private githubEmitterName: string;
	/** Front ServiceEmitter name. */
	private frontEmitterName: string;
	/** Front user to use when commenting on Front conversations. */
	private frontUser: string;
	/** Instance of the Front API retrieved from the Front ServiceEmitter. */
	private frontApi: Front;
	/** Instance of the Github API retrieved from the Github ServiceEmitter. */
	private githubApi: GithubApi;

	/**
	 * Constructor.
	 *
	 * @param config  Configuration object for initialising the bot.
	 */
	constructor(config: NotifyBotConfig) {
		super(config.botName);

		// Create a new listener for Github with the right Integration ID.
		const ghListener = this.addServiceListener('github', {
			client: config.botName,
			authentication: {
				appId: config.githubApp,
				pem: config.githubPEM,
				type: GithubLogin.App
			},
			path: WebhookPath,
			port: NotifyBotPort,
			type: ServiceType.Listener,
			webhookSecret: config.githubSecret
		});

		// Create a new emitter with the right Integration ID.
		const ghEmitter = this.addServiceEmitter('github', {
			authentication: {
				appId: config.githubApp,
				pem: config.githubPEM,
				type: GithubLogin.App
			},
			pem: config.githubPEM,
			type: ServiceType.Emitter
		});

		// Create a new emitter.
		const frontEmitter = this.addServiceEmitter('front', {
			token: config.frontApiKey,
		});

		// Throw if we didn't get either of the services.
		if (!ghListener) {
			throw new Error("Couldn't create a Github listener");
		}
		if (!ghEmitter) {
			throw new Error("Couldn't create a Github emitter");
		}
		if (!frontEmitter) {
			throw new Error("Couldn't create a Front emitter");
		}
		this.githubEmitterName = ghEmitter.serviceName;
		this.frontEmitterName = frontEmitter.serviceName;

		// Get the SDK handles
		// Github App API handle, used generally for most ops.
		this.githubApi = (<GithubHandle>ghEmitter.apiHandle).github;
		if (!this.githubApi) {
			throw new Error('No Github App API instance found');
		}

		// Get the Front details, too.
		const frontHandles = <FrontHandle>frontEmitter.apiHandle;
		this.frontApi = frontHandles.front;
		this.frontUser = config.frontUser;

		// All we need to do is listen to push events on the environment repo.
		ghListener.registerEvent({
				events: [ 'push' ],
				listenerMethod: this.checkPush,
				name: 'CheckMasterPush'
		});
	}

	/**
	 * ListenerMethod that interrogates pushes and determines component version changes.
	 *
	 * @param _registration  GithubRegistration object used to register the method.
	 * @param event          ServiceEvent containing the event information ('status' event).
	 * @returns              A void Promise once execution has finished.
	 */
	protected checkPush = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
		const pushEvent = <GithubApiTypes.PushEvent>event.cookedEvent.data;
		const commits = pushEvent.commits;
		const newHash = pushEvent.after;
		const oldHash = pushEvent.before;
		const owner = pushEvent.repository.owner.name;
		const repo = pushEvent.repository.name;

		// If a reference is virgin (00000...) then we totally ignore this.
		// It's probably a tag or a new branch. Either way, it holds no interest to us.
		if ((oldHash === VirginRef) || (newHash === VirginRef)) {
			return Promise.resolve();
		}

		// We're looking for the keyframe file in any of the commits.
		// If we find it, then this push requires us to get the difference between versions.
		// Note: This only works on modified files. Adding or removing a keyframe file makes
		// no sense logistically for NotifyBot.
		if (!_.some(commits, (commit) => _.includes(commit.modified, KeyframeFile))) {
			return Promise.resolve();
		}

		// Now get copies of the Keyframe file pre and post changes.
		// We'll decode each of these into objects so we can scan through and determine the changes in
		// version numbers for all components.
		let fileRequest = {
			api: this.githubApi,
			filepath: KeyframeFile,
			owner,
			hash: oldHash,
			repo,
		};
		let oldFile = '';
		let newFile = '';
		return this.retrieveFileFromHash(fileRequest).then((fileContents: string | void) => {
			if (!fileContents) {
				throw new Error(`Couldn't find the old hash for the Keyframe: ${owner}/${repo}:${oldHash}`);
			}

			oldFile = fileContents;
			fileRequest.hash = newHash;

			return this.retrieveFileFromHash(fileRequest);
		}).then((fileContents: string | void) => {
			if (!fileContents) {
				throw new Error(`Couldn't find the new hash for the Keyframe: ${owner}/${repo}:${newHash}`);
			}
			newFile = fileContents;

			// Both of these files are YAML. Decode the YAML and look specifically for
			// the versions of components, noting the old version and new version for each:
			//  * No old version, we must go through every version in a Changelog
			//  * Old version, we go through every version from old + 1 to new (might just be one)
			//  * No new version, we abort
			//  * Should *either* the old (if existing) or new version be invalid (ie. do not exist
			//    in the component's CHANGELOG.md), then the component is skipped and an error reported.
			const oldComponents = yaml.safeLoad(oldFile).keyframe.components || {};
			const newComponents = yaml.safeLoad(newFile).keyframe.components;

			// Track every new version by trying to match a component in the new version
			// with a component in the old.
			const componentVersions: ComponentTracker[] = [];
			_.each(newComponents, (value: any, key: string) => {
				// Try and find the old version of the component.
				const newVersion = value.version;
				const oldVersion = _.get(oldComponents[key], 'version', null);
				const componentRepo = value.repository;

				// If we have a new version, and it doesn't match the old version and has a repo,
				// then we want to do something with it.
				if (newVersion && repo && (newVersion !== oldVersion)) {
					componentVersions.push({
						oldVersion,
						name: key,
						newVersion,
						repo: componentRepo,
						incrementing: true,
						versions: undefined
					});
				} else if (newVersion === oldVersion) {
					// We don't operate on static versions.
					this.logger.log(LogLevel.INFO, `Component version for ${componentRepo} static, nothing to do ` +
						`for ${repo}`);
				}
			});

			// We now have a set of components. For each of them, we now go through the process
			// of following the Changelogs to find fixed issues.
			// Any thrown error here needs to abort the run, as it means fundamentally something is
			// wrong with the released versions.
			return Promise.map(componentVersions, (component) => this.getNewPRs(component));
		})
		.filter((component) => _.has(component, 'versions'))
		.then((components: ComponentTracker[]) => {
			// We've a list of components and the PRs for each version.
			// So, for each version we now harvest the relevant PRs and start the check
			// backwards for Front URLs.
			return Promise.map(components, (component: ComponentTracker) => {
				return Promise.all(_.map(component.versions, (prs, key) => {
					return this.tracePRAndNotify({
						environment: repo,
						repo: component.repo,
						version: key,
						deployedVersion: component.newVersion.substring(1),
						incrementing: component.incrementing,
						prs
					});
				}));
			}).return();
		}).catch((err: Error) => {
			// Call the VersionBot error specific method if this wasn't the short circuit for
			// committed code.
			this.reportError(new NotifyBotError(NotifyErrorCodes.KeyframeNotFound,
				`${process.env.NOTIFYBOT_NAME} failed to find Keyframe versions. The reason ` +
				`for this is:\r\n${err.message}\r\n` +
				'Please carry out relevant changes or alert an appropriate admin.',
				owner, repo, 'unknown'
			));
		});
	}

	/**
	 * Trace each PR for a deployed/regressed component version and notify the authors of the PR of its
	 * state, along with following any Front conversations associated with them via issues and
	 * commenting on them.
	 *
	 * @param prDetails  Details of the component being deployed/regressed.
	 * @returns           Promise on completion of notifications.
	 */
	private tracePRAndNotify(prDetails: DeployedPR): Promise<void> {
		// RegExp checking for issue cross referencing.
		const repoDetails = this.getRepoDetails(prDetails.repo);
		if (!repoDetails) {
			throw new Error(`Cannot find appropriate repo/owner for ${prDetails.repo}`);
		}

		// Go through each PR associated with the version.
		return Promise.map(prDetails.prs, (pr) => {
			const prData = {
				number: pr,
				owner: repoDetails.owner,
				repo: repoDetails.repo,
			};

			// Get the PR. Get all comments. Look for links to issues in both, including links to HQ issues.
			return Promise.join(this.dispatchToEmitter(this.githubEmitterName, {
					data: prData,
					method: this.githubApi.issues.getComments,
				}),
				this.dispatchToEmitter(this.githubEmitterName, {
					data: prData,
					method: this.githubApi.pullRequests.get
				}),
				(comments: GithubApiTypes.IssueComment[], pullRequest: GithubApiTypes.PullRequest) => {
					// Find reference to parent issues. We should not have any Front conversations in a PR.
					return  _.concat(_.flatMap(comments, (comment) => this.matchIssue(comment.body, IssueRefRE)),
						this.matchIssue(pullRequest.body, IssueRefRE),
						_.flatMap(comments, (comment) => this.matchIssue(comment.body, HqRE)),
						this.matchIssue(pullRequest.body, HqRE));
				}
			).then((issueNumbers) => {
				// Get every issue.
				return Promise.mapSeries(issueNumbers, (issueNumber) => {
					let topicIssues: TopicIssues;

					// Get any Front topics that exist on the issue.
					return this.getTopicsOnIssue(issueNumber, repoDetails.owner, repoDetails.repo)
					.then((results) => {
						topicIssues = results;
						return this.retrieveTopics(topicIssues.topics);
					}).then((conversations: string[]) => {
						// Now we have all Front threads. Examine each of them for their IDs, and then post a private
						// comment into them to note updated references.
						let bodyMessage: string;
						if (prDetails.incrementing) {
							bodyMessage = `Deployed version ${prDetails.deployedVersion} of ${prDetails.repo} on ` +
							`the ${prDetails.environment} has affected the following issues that are attached ` +
								'to this conversation:';
						} else {
							bodyMessage = `Regression to version ${prDetails.deployedVersion} of ${prDetails.repo} ` +
								`on the ${prDetails.environment} means the following issues attached to this ` +
								'conversation are relevant again:';
						}
						bodyMessage += '\n' + topicIssues.relatedIssues.join('\n');

						// Add the comment on every conversation.
						return Promise.map(conversations, (conversation) => {
							this.logger.log(LogLevel.INFO, `---> Commenting on Front ${conversation} for ` +
								`${prData.owner}/${prData.repo}#${prData.number}:${prDetails.version};` +
								` deployed version: ${prDetails.deployedVersion}`);

							return this.dispatchToEmitter(this.frontEmitterName, {
								data: {
									author_id: `alt:email:${this.frontUser}`,
									body: bodyMessage,
									conversation_id: conversation,
								},
								method: this.frontApi.comment.create,
							});
						});
					}).catch((err: Error) => {
						// We log that we couldn't post to Front, but we still want to post to Github PR if possible.
						this.logger.alert(AlertLevel.ERROR, 'Couldn\'t retrieve or post to the relevant Front ' +
							`conversations for \`${prData.owner}/${prData.repo}#${prData.number}:` +
							`${prDetails.version}\`: ${err.message}`);
					});
				});
			}).then(() => {
				// Finally comment on the actual PR saying that the component with this
				// PR in has been deployed, and in which version. Ping the author directly
				// so they know.
				return this.dispatchToEmitter(this.githubEmitterName,
					{
						data: prData,
						method: this.githubApi.pullRequests.get
					}
				).then((pullRequest) => {
					let body: string;
					if (prDetails.incrementing) {
						body = `Hi @${pullRequest.user.login}! This PR is now deployed in version ` +
							`\`${prDetails.deployedVersion}\` on the \`${prDetails.environment}\` environment. ` +
							`It was originally merged in version \`${prDetails.version}\`. Please remember to publish ` +
							'release notes on the `r/devops-reliability` flowdock channel.';
					} else {
						body = `Hi @${pullRequest.user.login}! This PR has been revoked as part of the deploy of ` +
							`version \`${prDetails.deployedVersion}\` on the \`${prDetails.environment}\` environment. ` +
							`It was originally merged in version \`${prDetails.version}\`. Please check with admins on ` +
							'`r/devops-reliability` as to why this occurred.';
					}

					this.logger.log(LogLevel.INFO, `--> Commenting on PR ${prData.owner}/${prData.repo}#` +
						`${prData.number}:${prDetails.version}; deployed version: ${prDetails.deployedVersion}`);

					return this.dispatchToEmitter(this.githubEmitterName, {
						data: {
							body,
							number: prData.number,
							owner: prData.owner,
							repo: prData.repo,
						},
						method: this.githubApi.issues.createComment
					});
				});
			});
		}).catch((err: Error) => {
			this.reportError(new NotifyBotError(NotifyErrorCodes.ConversationPostFailed,
				`Couldn't post to the conversation or PR for the specified issue: ${err}`,
				repoDetails.owner,
				repoDetails.repo,
				prDetails.version
			));
		}).return();
	}

	/**
	 * Match text within an Issue with a given RegExp.
	 *
	 * @param text    The string to test.
	 * @param regExp  The RegExp to test with (expected to be a global match).
	 * @returns       An array of any matching results.
	 */
	private matchIssue(text: string, regExp: RegExp): string[] {
		const results: string[] = [];
		let match: RegExpExecArray | null = regExp.exec(text);
		while (match) {
			if (!_.includes(results, match[1])) {
				results.push(match[1]);
			}
			match = regExp.exec(text);
		}

		return results;
	}

	/**
	 * Retrieve topics for an issue. This goes through an issue and associated HQ issues connected to find
	 * the relevant Front topic URLs for it.
	 *
	 * @param issueNumber  The Issue number to search.
	 * @param issueOwner   The owner of the Issue repository.
	 * @param issueRepo    The name of the Issue repository
	 * @returns            A Promise containing any Front topics found.
	 */
	private getTopicsOnIssue(issueNumber: string, issueOwner: string, issueRepo: string): Promise<TopicIssues> {
		// Ensure that we don't follow indirect HQ issues from other HQ issues.
		let skipHqIssue = true;
		const getIssueAndComments = (issue: string, owner: string, repo: string, method: object) => {
			// We need to look both at the issue body itself and all comments to
			// get potential Front conversations as well as links to HQ.
			return Promise.join(
				this.dispatchToEmitter(this.githubEmitterName, {
					data: {
						number: issue,
						owner,
						repo,
					},
					method: this.githubApi.issues.get,
				}),
				this.dispatchToEmitter(this.githubEmitterName, {
					data: {
						number: issue,
						owner,
						repo,
					},
					method: this.githubApi.issues.getComments,
				}),
				method
			).catch((err: Error) => {
				// If we couldn't find the comments (or in fact the PR, but that must exist
				// as we've been sent the event), then it's not an error. We still want to
				// post on the PR that a version has been deployed, even though there may
				// be no Front topics.
				if (err.message !== 'Not Found') {
					throw err;
				}

				return Promise.resolve([]);
			});
		};
		const matchFrontTopics = (issue: GithubApiTypes.Issue, comments: GithubApiTypes.IssueComment[]) => {
			const frontRE = /\[front conversations\]\((.*)\)/gi;

			// Match any Front conversations or HQ ref issues.
			return _.concat(this.matchIssue(issue.body, frontRE),
				_.flatMap(comments, (comment) => this.matchIssue(comment.body, frontRE)));
		};
		const githubURL = `https://github.com`;
		const relatedIssues: string[] = [];

		// If issue starts with a #, this is an HQ issue.
		if (_.startsWith(issueNumber, '#')) {
			issueNumber = issueNumber.substring(1);
			skipHqIssue = false;
		}

		// Get local issues. Might include HQ issues.
		return getIssueAndComments(issueNumber, issueOwner, issueRepo,
		(issue: GithubApiTypes.Issue, comments: GithubApiTypes.IssueComment[]) => {
			const hqRefs = _.concat(_.flatMap(comments, (comment) => this.matchIssue(comment.body, HqRE)),
				this.matchIssue(issue.body, HqRE));

			// Match any Front conversations or HQ ref issues.
			let frontTopics = matchFrontTopics(issue, comments);
			if (frontTopics.length > 0) {
				relatedIssues.push(`${issue.title}: ${githubURL}/${issueOwner}/${issueRepo}/issues/${issueNumber}`);
			}

			// If we have any HQ refs, we need to now do the same thing
			// with those.
			if (!skipHqIssue && (hqRefs.length > 0)) {
				return Promise.mapSeries(hqRefs, (hqRef) => {
					return getIssueAndComments(hqRef, HqOwner, HqRepo,
						(hqIssue: GithubApiTypes.Issue, hqComments: GithubApiTypes.IssueComment[]) => {
							const hqTopics = matchFrontTopics(hqIssue, hqComments);
							if (hqTopics.length > 0) {
								relatedIssues.push(`${hqIssue.title}: ${githubURL}/${HqOwner}/` +
									`${HqRepo}/issues/${hqRef}`);
							}
							return hqTopics;
						}
					);
				}).then((hqRefFrontTopics: string[][]) => {
					return frontTopics.concat(_.flatten(hqRefFrontTopics));
				});
			}

			// Else just return the already resolved topics.
			return frontTopics;
		}).then((topics) => {
			return {
				relatedIssues,
				topics
			};
		});
	}

	/**
	 * Retrieves the PRs from the changelog file given an old version (if any) and a new version.
	 * It determines whether a component is being incremented or decremented.
	 *
	 * @param component  Component information object.
	 * @returns          An updated component information object.
	 */
	private getNewPRs(component: ComponentTracker): Promise<ComponentTracker> {
		// Get the changelog for the component from its `master`, as this file
		// *should* include all given versions. If it doesn't, then something is broken
		// or the keyframe is incorrect.
		const repo = this.getRepoDetails(component.repo);
		let allTags: string[];
		if (!repo) {
			throw new Error(`Cannot find appropriate repo/owner for ${component.repo}`);
		}

		// Retrieve all tagged versions
		return this.dispatchToEmitter(this.githubEmitterName, {
			data: {
				owner: repo.owner,
				repo: repo.repo
			},
			method: this.githubApi.repos.getTags
		}).then((tags: GithubApiTypes.Tag[]) => {
			allTags = _.map(tags, 'name');

			// Retrieve the changelog.
			return this.retrieveFileFromHash({
				api: this.githubApi,
				filepath: ChangelogFile,
				hash: 'HEAD',
				owner: repo.owner,
				repo: repo.repo,
			});
		}).then((file) => {
			if (!file) {
				throw new Error(`Couldn't find the CHANGELOG.md in ${repo.owner}/${repo.repo}`);
			}

			// We have the Changelog, we want to cull any versions which aren't
			// relevant by removing them. Do this by splitting the lines based on
			// the old version and the new version.
			// For both incrementing and decrementing versions, we want all the versions
			// that exist between the greatest version (inclusive) and the oldest version
			// (exclusive).
			// We can easily get this by swapping the versions for decrementing.
			let changeParts = [ file ];
			let changelogString = '';

			// Ensure that the old version (if there is one) and the new version are valid.
			if (component.oldVersion) {
				if (!_.includes(allTags, component.oldVersion)) {
					this.reportError(new NotifyBotError(NotifyErrorCodes.OldVersionInvalid,
						`The old version of the component in the old keyframe was invalid`,
						repo.owner,
						repo.repo,
						component.oldVersion
					));
					return component;
				}
			}
			if (!_.includes(allTags, component.newVersion)) {
				this.reportError(new NotifyBotError(NotifyErrorCodes.NewVersionInvalid,
					`The new version of the component in the new keyframe was invalid`,
					repo.owner,
					repo.repo,
					component.newVersion
				));

				return component;
			}

			// If there's no old version, then *anything* we release is essentially new and
			// therefore is now implemented. It is implicitly an incrementing version.
			if (!component.oldVersion) {
				component.incrementing = true;
			} else if (semverGt(component.oldVersion, component.newVersion)) {
				// A new version less than an older version is a version down.
				component.incrementing = false;
			} else if (semverGt(component.newVersion, component.oldVersion)) {
				component.incrementing = true;
			}

			// If there is an old component, use it to cull anything before that version.
			// We end up with a portion of the changelog that only includes details
			// between the old version and the last entry in the changelog.
			if (component.oldVersion) {
				changeParts = changeParts[0].split(component.incrementing ? `## ${component.oldVersion}` :
					`## ${component.newVersion}`);
			}

			// The splitting strips the previous header entry, so add it back depending on whether we're
			// incrementing or decrementing in version.
			// Then split the changelog portion again to end up only with a portion that
			// contains all entries between the old and new version.
			changelogString = `## ${component.incrementing ? component.newVersion : component.oldVersion}` +
				changeParts[0].split(component.incrementing ? component.newVersion : (component.oldVersion || ''))[1];

			// Split the changelog based on version entries. This ensures we end up with
			// an array, each entry being a single version set of changes, for example:
			//  "v1.2.3 - 2018-08-02\n\n* This does something else #124 [Author]"
			//  "v1.2.2 - 2018-08-01\n\n* This does something #123 [Author]"
			const versionEntries = changelogString.split('## ');

			// For each entry, ensure it's a valid changelog entry, and then match the
			// format for an entry ("* <entry> #<pr> [<author>]"). For each PR found
			// add it to the version track for that version.
			const versionTracker: VersionPRTracker = {};
			_.each(versionEntries, (versionData) => {
				let verMatches: RegExpExecArray | null;
				const versionMatch = versionData.match(/^v([0-9]+\.[0-9]+\.[0-9]+)/);
				if (versionMatch) {
					const version = versionMatch[1];
					const matchRE = /\*\s+.*\s+#([0-9]+)\s\[.*\]/gm;
					verMatches = matchRE.exec(versionData);
					while (verMatches) {
						if (!versionTracker[version]) {
							versionTracker[version] = [];
						}
						versionTracker[version].push(verMatches[1]);
						verMatches = matchRE.exec(versionData);
					}
				}
			});
			component.versions = versionTracker;

			return component;
		});
	}

	/**
	 * Retrieves a file from a specific repository, given a file path and hash.
	 *
	 * @param fileRequest  Full details on the file that is required.
	 * @returns            Promise containing contents of the file as a string, or void if unavailable.
	 */
	private retrieveFileFromHash(fileRequest: HashedFileRequest): Promise<string | void> {
		const request = {
			data: {
				owner: fileRequest.owner,
				path: fileRequest.filepath,
				ref: fileRequest.hash,
				repo: fileRequest.repo,
			},
			method: this.githubApi.repos.getContent
		};

		// Retrieve the file, and decode.
		return this.dispatchToEmitter(this.githubEmitterName, request).then((file: GithubApiTypes.Content) => {
			if (!file) {
				return;
			}

			if (file.encoding !== 'base64') {
				this.logger.log(LogLevel.WARN, 'Content is not in expected format');
				return;
			}

			// Convert from Base64 into valid content.
			return Buffer.from(file.content, 'base64').toString();
		});
	}

	/**
	 * Retrieve all Front conversations from a set of Front topics.
	 *
	 * @param topics  The list of topic IDs to retrieve conversations for.
	 * @returns       Promise containing all of the conversations IDs found.
	 */
	private retrieveTopics(topics: string[]): Promise<string[]> {
		// Retrieve the formal topic ID for the shortened form.
		return Promise.map(topics, (topic) => {
			const shortenedTopic = topic.substring(topic.lastIndexOf('/') + 1);
			return this.dispatchToEmitter(this.frontEmitterName, {
				data: {
					topic_id: shortenedTopic
				},
				method: this.frontApi.topic.listConversations
			}).then((conversations: TopicConversations) => {
				return _.map(conversations._results, 'id');
			});
		}).then(_.flatten);
	}

	/**
	 * Return an object containing both the owner of a repository and the repositories name.
	 *
	 * @param fullRepo  Full repository string.
	 * @returns         Object containing repository details, or void if not valid.
	 */
	private getRepoDetails(fullRepo: string): RepoDetails | void {
		const urlComps = fullRepo.match(/^.*:\/\/.*\/(.*)\/(.*)$/);
		if (!urlComps) {
			return;
		}

		return {
			owner: urlComps[1],
			repo: urlComps[2]
		};
	}

	/**
	 * Report an error to the console.
	 *
	 * @param error  Error object containing all required information.
	 */
	private reportError(error: NotifyBotError): void {
		this.logger.alert(AlertLevel.ERROR, `${error.message}: ${error.owner}/${error.repo}:${error.version}`);
	}
}

/**
 * Create a NotifyBot instance.
 *
 * @returns A new NotifyBot instance.
 */
export function createBot(): NotifyBot {
	const notifyBotConfig = {
		botName: process.env.NOTIFYBOT_NAME,
		frontApiKey: process.env.NOTIFYBOT_FRONT_API_KEY,
		frontUser: process.env.NOTIFYBOT_FRONT_USERNAME,
		githubApp: process.env.NOTIFYBOT_GITHUB_INTEGRATION_ID,
		githubPEM: process.env.NOTIFYBOT_GITHUB_PEM,
		githubSecret: process.env.NOTIFYBOT_GITHUB_WEBHOOK_SECRET,
	};
	_.each(notifyBotConfig, (value) => {
		if (!value) {
			throw new Error('At least one required envvar for NotifyBot is missing');
		}
	});

	return new NotifyBot(notifyBotConfig);
}
