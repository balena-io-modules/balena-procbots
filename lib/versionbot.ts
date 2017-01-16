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

// VersionBot listens for merges of a PR to the `master` branch and then
// updates any packages for it.
import { GithubBot, RepoWorkerMethod, RepoEvent } from './githubbot';
import * as Promise from 'bluebird';
import Path = require('path');
import * as _ from 'lodash';

//const temp: any = Promise.promisifyAll(require('temp').track());
const temp: any = Promise.promisifyAll(require('temp'));
const mkdirp: any = Promise.promisify(require('mkdirp'));
const rmdir: any = Promise.promisify(require('rmdir'));
const exec: any = Promise.promisify(require('child_process').exec);

// Here's something worth noting, some of the URLs that the 'github' API
// calls have changed and are no longer valid. Sigh.
// PR reviews are notable in this regard.
const GithubApi: any = require('github');

// The VersionBot is built ontop of GithubBot, which does all the heavy lifting and scheduling.
export class VersionBot extends GithubBot {
	// Name and register ourself.
	constructor(webhooks: string[], integration: number) {
		super(webhooks, integration);

		// This is the VersionBot.
		this._botname = 'VersionBot';

		// Authenticate the Github API.
		this._github.authenticate();
	}

	// When a relevant event occurs, this is fired.
	firedEvent(event: string, repoEvent: any): void {
		// Just call GithubBot's queueEvent method, telling it which method to use.
		super.queueEvent({
			event: event,
			repoData: repoEvent,
			workerMethod: this.prHandler
		});
	}

	// Handle a particular PR event.
	protected prHandler = (event: string, data: any) => {
		let method = Promise.resolve();

		if (event === 'pull_request') {
			switch (data.action) {
				// Version check for a PR open or commit against it.
				case 'opened':
				case 'synchronize':
					method = this.checkVersioning(event, data);
					break;

				// Version up on a PR close.
				case 'closed':
					method = this.generateVersion(event, data);
					break;

				// Check the rest at merge, if it's not for it it'll exit.
				default:
					method = this.mergePR(event, data);
					break;
			}
		} else if (event === 'pull_request_review') {
			method = this.mergePR(event, data);
		}

		return method;
	}

	// Checks the newly opened PR and its commits.
	//  1. Triggered by an 'opened' or 'synchronize' event.
	//  2. If any PR commit has a 'Change-Type: <type>' commit, we create a status approving the PR.
	//  3. If no PR commit has a 'Change-Type: <type>' commit, we create a status failing the PR.
	protected checkVersioning = (event: string, data: any) => {
		const githubApi = this._github.githubApi;
		const pr = data.pull_request;
		const head = data.pull_request.head;
		const owner = head.repo.owner.login;
		const name = head.repo.name;
		const gitCall = this._github.makeCall;
		console.log('PR has been opened or synchronised, check for commits');

		return gitCall(githubApi.pullRequests.getCommits, {
			owner: owner,
			repo: name,
			number: pr.number
		}).then((commits: any) => {
			let changetypeFound: boolean = false;
			// Go through all the commits. We're looking for, at a minimum, a 'change-type:' tag.
			for (let index = 0; index < commits.length; index += 1) {
				const commit: any = commits[index];
				const commitMessage: string = commit.commit.message;
				const invalidCommit = !commitMessage.match(/^change-type:\s*(patch|minor|major)\s*$/mi);

				if (!invalidCommit) {
					changetypeFound = true;
					break;
				}
			}

			// If we found a change-type message, then mark this commit as ok.
			if (changetypeFound) {
				console.log('Found a good versionist tag.');
				return gitCall(githubApi.repos.createStatus, {
					owner: owner,
					repo: name,
					sha: head.sha,
					state: 'success',//'failure'
					description: 'Found a valid Versionist `Change-Type` tag',
					context: 'Versionist'
				});
			}

			// Else we mark it as having failed.
			console.log('Found no versionist tag at all');
			return gitCall(githubApi.repos.createStatus, {
				owner: owner,
				repo: name,
				sha: head.sha,
				state: 'failure',
				description: 'None of the commits in the PR have a `Change-Type` tag',
				context: 'Versionist'
			});
		});
	}

	// Merges a PR, if appropriate:
	//  1. Triggered by a 'labeled' event ('flow/ready-to-merge') or a 'pull_request_review_comment'
	//  2. Checks all review comments to ensure that at least one approves the PR (and that no comment
	//     that may come after it includes a 'CHANGES_REQUESTED' state).
	//  3. Merges the PR to master, deletes the branch (does *not* close any associated PR).
	//
	// It should be noted that this will, of course, result in a 'closed' event on a PR, which
	// in turn will feed into the 'generateVersion' method below.
	protected mergePR = (event: string, data: any) => {
		// States for review comments are:
		//  * COMMENT
		//  * CHANGES_REQUESTED
		//  * APPROVED
		//
		// We *only* go through with a merge should:
		//  * The 'flow/ready-to-merge' label appear on the PR issue
		//  * There is an 'APPROVED' review comment *and* no comment after is of state 'CHANGES_REQUESTED'
		// The latter overrides the label should it exist, as it will be assumed it is in error.
		const githubApi = this._github.githubApi;
		const pr = data.pull_request;
		const head = data.pull_request.head;
		const owner = head.repo.owner.login;
		const name = head.repo.name;
		const gitCall = this._github.makeCall;
		let approvePromise: Promise<boolean> = Promise.resolve(false);
		let labelPromise: Promise<boolean> = Promise.resolve(false);

		const getReviewComments = () => {
			return gitCall(githubApi.pullRequests.getReviews, {
				owner: owner,
				repo: name,
				number: pr.number
			}).then((reviews: any[]) => {
				// Cycle through reviews, ensure that any approved review occurred after any requiring changes.
				let approved: boolean = false;
				reviews.forEach((review: any) => {
					if (review.state === 'APPROVED') {
						approved = true;
					} else if (review.state === 'CHANGES_REQUESTED') {
						approved = false;
					}
				});
				console.log(reviews);

				return approved;
			});
		};

		const getLabels = ()=> {
			return gitCall(githubApi.issues.getIssueLabels, {
				owner: owner,
				repo: name,
				number: pr.number
			}).then((labels: any) => {
				// Check to see if we have a 'flow/ready-to-merge' label.
				let mergeLabelFound = false;
				labels.forEach((label: any) => {
					if (label.name === 'flow/ready-to-merge') {
						mergeLabelFound = true;
					}
				});

				return mergeLabelFound;
			});
		};

		console.log('PR has been updated with comments or a label');
		// Check the action on the event to see what we're dealing with.
		switch (data.action) {
			// Submission is a PR review
			case 'submitted':
				// Data action will always be submitted.
				// Do we need changes? If so we short-circuit.
				if (data.review.state === 'changes_requested') {
					return Promise.resolve();
				} else if (data.review.state === 'approved') {
					// Else if approved, just get the labels.
					approvePromise = Promise.resolve(true);
				} else {
					// For every other type of comment, get the list of review comments.
					approvePromise = getReviewComments();
				}

				// We always need to get the labels.
				labelPromise = getLabels();
				break;

			// Labeled or unlabeled is... a label.
			case 'labeled':
			case 'unlabeled':
				// If the label was just created, or edited, then it's valid!
				if (data.label.name === 'flow/ready-to-merge') {
					// If deleted, short-circuit, not ready to merge.
					if (data.action === 'unlabeled') {
						console.log('Label: deleted');
						return Promise.resolve();
					}

					labelPromise = Promise.resolve(true);
				} else {
					labelPromise = getLabels();
				}

				// We always need to get the review comments.
				approvePromise = getReviewComments();
				break;

			default:
				// We have no idea what sparked this, but we're not doing anything!
				console.log('Invalid data action trigged merge condition, exiting');
				return Promise.resolve();
		}

		return Promise.all([
			approvePromise,
			labelPromise
		]).then((results: boolean[]) => {
			if (!_.includes(results, false)) {
				console.log(`Merging PR ${pr.number} to master of ${owner}/${name}`);
				return gitCall(githubApi.pullRequests.merge, {
					owner: owner,
					repo: name,
					number: pr.number,
					commit_title: `Auto-merge for PR ${pr.number} via Procbot`
				});
			}

			console.log(`Unable to merge: PRapproved(${results[0]}, Labels(${results[1]})`);
		});
	};

	// IMPORTANT NOTE: This all needs tearing up and throwing away!
	// 				   Individual users, even a specific one for bots, should *not* be carrying out the
	// 				   final version changes. Instead we need to use the Github DB API to manually create
	// 				   git objects to carry this work out *as* the bot.
	// Actually generate a new version of a component:
	//  1. Clones a copy of the repo to be operated on, at the HEAD of the repo on the master branch (this is important)
	//  2. Runs `versionist` on the repo. It expects to see a new `CHANGELOG.md` and possibly a new `package.json`
	//  3. It looks for the new version of the component, first trying `package.json` and then falling back to the `CHANGELOG.md`
	//  4. It commits the changed files to the master branch
	//  5. It creates a new tag with the given version, eg. (v1.2.3)
	//  6. It pushes the changed files and the tag to the `master` branch
	//  7. If there is a `package.json` and this is an `npm` module, it also publishes it (TBD, CLARIFY)
	protected generateVersion = (event: string, data: any) => {
		const repo = data.repository;
		const pr = data.pull_request;

		console.log('PR has been closed, attempting to carry out a version up.');

		// If it's not closed, not on the master or not merged, we do not continue.
		if ((data.action !== 'closed') || (pr.base.ref !== 'master') || (pr.merged !== true)) {
			return Promise.resolve();
		}

		// Ensure we have a base directory to use.
		if (!process.env.VERSIONBOT_REPOBASE) {
			throw new Error('Base directory for carrying out version upping does not exist');
		}
		const repoFullName = repo.full_name;
		const repoName = repo.name;
		const commitHash = pr.merge_commit_sha;
		const cwd = process.cwd();
		const moddedFiles: string[] = [];
		let newVersion: string;
		let fullPath: string;

		// Create new work dir.
		return temp.mkdirAsync(`${repoName}-${commitHash}`).then((tempDir: string) => {
			fullPath = tempDir;

			// Clone the repository inside the directory using the commit name and the run versionist.
			// We only care about output from the git status.
			// IMPORTANT NOTE: Currently, Versionist will fail if it doesn't find a
			// 	`package.json` file. This needs rectifying in Versionist, as this code doesn't pick it up.
			const promiseResults: string[] = [];
			return Promise.mapSeries([
				`git clone ssh://github.com/${data.repository.full_name} ${fullPath}`,
				'versionist',
				'git status -s'
			], (command) => {
				return exec(command, { cwd: fullPath });
			}).get(2);
		}).then((status: string) => {
			// Split the changes by line
			const changeLines = status.split('\n');

			// For each change, get the name of the change. We shouldn't see *anything* that isn't
			// expected, and we should only see modifications. Log anything else as an issue
			// (but not an error).
			changeLines.forEach((line) => {
				// If we get anything other than an 'M', flag this.
				const match = line.match(/^\sM\s(.+)$/);
				if (!match) {
					console.log(`Found a spurious git status entry: ${line.trim()}`);
				} else {
					moddedFiles.push(match[1]);
				}
			});

			// Now we get the new version from the CHANGELOG (*not* the package.json, it may not exist).
			return exec('cat CHANGELOG.md', { cwd: fullPath }).then((contents: string) => {
				// Only interested in the first match for '## v...'
				const match = contents.match(/^## v([0-9]\.[0-9]\.[0-9]).+$/m);

				if (!match) {
					throw new Error('Cannot find new version for ${fullRepoName}-${commitHash}');
				}

				newVersion = match[1];
			});
		}).then(() => {
			// Add each file (we don't do a single commit, want to make sure they're all valid).
			return Promise.map(moddedFiles, (file) => {
				return exec(`git add ${file}`, { cwd: fullPath });
			});
		}).then(() => {
			// Commit, tag, push.
			return Promise.mapSeries([
					`git commit -m "${newVersion}"`,
					`git tag -a ${newVersion} -m "${newVersion}"`
					//'git push origin master'
			], (command) => {
				return exec(command, { cwd: fullPath });
			});
		}).then(() => {
			console.log(`Upped version of ${repoFullName} to ${newVersion}; tagged and pushed.`);
		}).catch((err: Error) => {
			// TBD: This needs to go somewhere sensible.
			// Most probably:
			//	* logentries.com
			//	* Hubot alert to relevant maintainer (so we need to register these per-repo)
			//	* Maybe even a 'Danger! Danger, repo maintainer!' alert email, if this is bad news.
			console.log(err);
		});
	}
}

// Export the Versionbot to the app.
// We register the Github events we're interested in here.
export function createBot(integration: number): VersionBot {
	return new VersionBot([ 'pull_request', 'pull_request_review' ], process.env.INTEGRATION_ID);
}
