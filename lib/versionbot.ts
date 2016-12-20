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
import { GithubBot, RepoWorkerMethod } from './githubbot';
import * as Promise from 'bluebird';
import Path = require('path');
//const temp: any = Promise.promisifyAll(require('temp').track());
const temp: any = Promise.promisifyAll(require('temp'));
const mkdirp: any = Promise.promisify(require('mkdirp'));
const rmdir: any = Promise.promisify(require('rmdir'));
const exec: any = Promise.promisify(require('child_process').exec);

// The VersionBot is built ontop of GithubBot, which does all the heavy lifting and scheduling.
export class VersionBot extends GithubBot {
	// Name and register ourself.
	constructor(webhooks: string[]) {
		super(webhooks);

		// This is the VersionBot.
		this._botname = 'VersionBot';
	}

	// When a relevant event occurs, this is fired.
	firedEvent(event: string, repoEvent: any): void {
		// Just call GithubBot's queueEvent method, telling it which method to use.
		super.queueEvent({
			event: event,
			repoData: repoEvent,
			workerMethod: this.generateVersion
		});
	}

	// Actually generate a new version of a component:
	//  1. Clones a copy of the repo to be operated on, at the HEAD of the repo on the master branch (this is important)
	//  2. Runs `versionist` on the repo. It expects to see a new `CHANGELOG.md` and possibly a new `package.json`
	//  3. It looks for the new version of the component, first trying `package.json` and then falling back to the `CHANGELOG.md`
	//  4. It commits the changed files to the master branch
	//  5. It creates a new tag with the given version, eg. (v1.2.3)
	//  6. It pushes the changed files and the tag to the `master` branch
	//  7. If there is a `package.json` and this is an `npm` module, it also publishes it (TBD, CLARIFY)
	private generateVersion(data: any) {
		const repo = data.repository;
		const pr = data.pull_request;

		// If it's not closed, not on the master or not merged, we do not continue.
		if ((pr.state !== 'closed') || (pr.base.ref !== 'master') || (pr.merged !== true)) {
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
export function createBot(): VersionBot {
	return new VersionBot([ 'pull_request' ]);
}
