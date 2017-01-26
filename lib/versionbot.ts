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
import * as ProcBot from './procbot';
import * as GithubBot from './githubbot';
import * as Promise from 'bluebird';
import Path = require('path');
import * as _ from 'lodash';
import * as path from 'path';

//const temp: any = Promise.promisifyAll(require('temp').track());
const temp: any = Promise.promisifyAll(require('temp'));
const mkdirp: any = Promise.promisify(require('mkdirp'));
const rmdir: any = Promise.promisify(require('rmdir'));
const exec: any = Promise.promisify(require('child_process').exec);
const fs: any = Promise.promisifyAll(require('fs'));

// TBD
// Constant a load of the text ('Versionbot' + email + etc.)

// Here's something worth noting, some of the URLs that the 'github' API
// calls have changed and are no longer valid. Sigh.
// PR reviews are notable in this regard.
const GithubApi: any = require('github');

// The VersionBot is built ontop of GithubBot, which does all the heavy lifting and scheduling.
export class VersionBot extends GithubBot.GithubBot {
    // Name and register ourself.
    constructor(integration: number) {
        super(integration);

        // This is the VersionBot.
        this._botname = 'VersionBot';

        // We have two different WorkerMethods here:
        // 1) Status checks on PR open and commits
        // 2) PR review and label checks for merge
        _.forEach([
            {
                name: 'CheckVersionistCommitStatus',
                events: [ 'pull_request' ],
                suppressionLabels: [ 'flow/no-version-checks' ],
                workerMethod: this.checkVersioning
            },
            {
                name: 'CheckForReadyMergeState',
                events: [ 'pull_request', 'pull_request_review' ],
                triggerLabels: [ 'flow/ready-to-merge' ],
                suppressionLabels: [ 'flow/no-version-checks' ],
                workerMethod: this.mergePR
            }
        ], (reg: GithubBot.GithubActionRegister) => {
            this.registerAction(reg);
        });

        // Authenticate the Github API.
        this.authenticate();
    }

    // Checks the newly opened PR and its commits.
    //  1. Triggered by an 'opened' or 'synchronize' event.
    //  2. If any PR commit has a 'Change-Type: <type>' commit, we create a status approving the PR.
    //  3. If no PR commit has a 'Change-Type: <type>' commit, we create a status failing the PR.
    protected checkVersioning = (action: GithubBot.GithubAction, data: any) => {
        const githubApi = this.githubApi;
        const pr = data.pull_request;
        const head = data.pull_request.head;
        const owner = head.repo.owner.login;
        const name = head.repo.name;

        this.log(ProcBot.LogLevel.DEBUG, `${action.name}: entered`);

        // Only for opened or synced actions.
        if ((data.action !== 'opened') && (data.action !== 'synchronize')) {
            return Promise.resolve();
        }

        return this.gitCall(githubApi.pullRequests.getCommits, {
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
                return this.gitCall(githubApi.repos.createStatus, {
                    owner: owner,
                    repo: name,
                    sha: head.sha,
                    state: 'success',
                    description: 'Found a valid Versionist `Change-Type` tag',
                    context: 'Versionist'
                }).return(true);
            }

            // Else we mark it as having failed.
            this.log(ProcBot.LogLevel.DEBUG, `${action.name}: No valid 'Change-Type' tag found, failing last commit`);
            return this.gitCall(githubApi.repos.createStatus, {
                owner: owner,
                repo: name,
                sha: head.sha,
                state: 'failure',
                description: 'None of the commits in the PR have a `Change-Type` tag',
                context: 'Versionist'
            }).return(false);
        }).then(() => {
            // If the author was Versionbot and the file marked was CHANGELOG, then
            // we are now going to go ahead and perform a merge.
            //
            // Get the list of commits for the PR, then get the very last commit SHA.
            return this.gitCall(githubApi.repos.getCommit, {
                owner,
                repo: name,
                sha: head.sha
            }).then((headCommit: any) => {
                // We will go ahead and perform a merge if we see Versionbot has committed
                // something with 'CHANGELOG.md' in it.
                const commit = headCommit.commit;
                const files = headCommit.files;

                if ((commit.committer.name === process.env.VERSIONBOT_NAME) &&
                    _.find(files, (file: any) => {
                        return file.filename === 'CHANGELOG.md';
                    })) {
                        // We go ahead and merge.
                        const commitVersion = commit.message;
                        return this.gitCall(githubApi.pullRequests.merge, {
                            owner,
                            repo: name,
                            number: pr.number,
                            commit_title: `Auto-merge for PR ${pr.number} via Versionbot`
                        }, 3).then((mergedData: any) => {
                            // We get an SHA back when the merge occurs, and we use this for a tag.
                            // Note date gets filed in automatically by API.
                            return this.gitCall(githubApi.gitdata.createTag, {
                                owner,
                                repo: name,
                                tag: commitVersion,
                                message: commitVersion,
                                object: mergedData.sha,
                                type: 'commit',
                                tagger: {
                                    name: process.env.VERSIONBOT_NAME,
                                    email: process.env.VERSIONBOT_EMAIL
                                }
                            });
                        }).then((newTag: any) => {
                            console.log(newTag);
                            // We now have a SHA back that contains the tag object.
                            // Create a new reference based on it.
                            return this.gitCall(githubApi.gitdata.createReference, {
                                owner,
                                repo: name,
                                ref: `refs/tags/${commitVersion}`,
                                sha: newTag.sha
                            });
                        });
                    }
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
    //protected mergePR = (event: string, data: any) => {
    protected mergePR = (action: GithubBot.GithubAction, data: any) => {
        // States for review comments are:
        //  * COMMENT
        //  * CHANGES_REQUESTED
        //  * APPROVED
        //
        // We *only* go through with a merge should:
        //  * The 'flow/ready-to-merge' label appear on the PR issue
        //  * There is an 'APPROVED' review comment *and* no comment after is of state 'CHANGES_REQUESTED'
        // The latter overrides the label should it exist, as it will be assumed it is in error.
        const githubApi = this.githubApi;
        const pr = data.pull_request;
        const head = data.pull_request.head;
        const owner = head.repo.owner.login;
        const repo = head.repo.name;
        const repoFullName = `${owner}/${repo}`;
        const cwd = process.cwd();
        let newVersion: string;
        let fullPath: string;
        let branchName: string;
        let newTreeSha: string;

        interface EncodedFile {
            file: string,
            encoding: string,
            treeEntry?: any,
            blobSha?: string
        };

        console.log('PR has been updated with comments or a label');

        // Check the action on the event to see what we're dealing with.
        switch (data.action) {
            // Submission is a PR review
            case 'submitted':
            case 'labeled':
            case 'unlabeled':
                break;

            default:
                // We have no idea what sparked this, but we're not doing anything!
                console.log(`Data action wasn't useful for merging`);
                return Promise.resolve();
        }

        return this.gitCall(githubApi.pullRequests.getReviews, {
            owner: owner,
            repo: name,
            number: pr.number
        }).then((reviews: any[]) => {
            // Cycle through reviews, ensure that any approved review occurred after any requiring changes.
            let approved = false;
            // Ooo, this is a good one. We can't do this:
            //    reviews.forEach((review: any) => {
            //      if (review.state === 'APPROVED') {
            //            approved = true;
            //      } else if (review.state === 'CHANGES_REQUESTED') {
            //            approved = false;
            //      }
            //     });
            //
            // Because of the CFA going on here: https://github.com/Microsoft/TypeScript/issues/11498
            // This errors because it's optimistic that [].forEach() execution can't affect the
            // 'approved' variable, therefore it implicitly believes it can only ever be 'false'
            // and barfs on the 'if (approved === true)' line claiming 'true' cannot be 'false'.
            // Not great. Still, easy to use a straight for() loop.
            approved = false;
            for (let index = 0; index < reviews.length; index += 1) {
                const review = reviews[index];
                if (review.state === 'APPROVED') {
                    approved = true;
                } else if (review.state === 'CHANGES_REQUESTED') {
                    approved = false;
                }
            }

            if (approved === false) {
                console.log(`Unable to merge, no approval comment})`);
                return Promise.resolve();
            }

            // If all is well, we now generate a new version.
            // This will end up committing relevant files, which in turn will get
            // `sychronized`, kicking off a status check and final merge.
            //return this.generateVersion(owner, name, pr.number);

            // Actually generate a new version of a component:
            // 1. Clone the repo
            // 2. Checkout the appropriate branch given the PR number
            // 3. Run `versionist`
            // 4. Read the `CHANGELOG.md` (and any `package.json`, if present)
            // 5. Base64 encode them
            // 6. Call Github to update them, in serial, CHANGELOG last (important for merging expectations)
            // 7. Finish
            console.log('PR is ready to merge, attempting to carry out a version up.');

            // Get the branch for this PR.
            return this.gitCall(githubApi.pullRequests.get, {
                owner: owner,
                repo: repo,
                number: pr
            }).then((prInfo: any) => {
                // Get the relevant branch.
                branchName = prInfo.head.ref;

                // Create new work dir.
                return temp.mkdirAsync(`${repo}-${pr}_`).then((tempDir: string) => {
                    fullPath = `${tempDir}${path.sep}`;

                    // Clone the repository inside the directory using the commit name and the run versionist.
                    // We only care about output from the git status.
                    // IMPORTANT NOTE: Currently, Versionist will fail if it doesn't find a
                    //     `package.json` file. This needs rectifying in Versionist, as this code doesn't pick it up.
                    const promiseResults: string[] = [];
                    return Promise.mapSeries([
                        `git clone https://${process.env.WEBHOOK_SECRET}:x-oauth-basic@github.com/${repoFullName} ${fullPath}`,
                        `git checkout ${branchName}`,
                        'versionist',
                        'git status -s'
                    ], (command) => {
                        return exec(command, { cwd: fullPath });
                    }).get(3)
                });
            }).then((status: string) => {
                // Split the changes by line
                let changeLines = status.split('\n');
                const moddedFiles: string[] = [];
                let changeLogFound = false;

                if (changeLines.length === 0) {
                    throw new Error(`Couldn't find any status changes after running 'versionist', exiting`);
                }
                changeLines = _.slice(changeLines, 0, changeLines.length - 1);
                // For each change, get the name of the change. We shouldn't see *anything* that isn't
                // expected, and we should only see modifications. Log anything else as an issue
                // (but not an error).
                changeLines.forEach((line) => {
                    // If we get anything other than an 'M', flag this.
                    const match = line.match(/^\sM\s(.+)$/);
                    if (!match) {
                        throw new Error(`Found a spurious git status entry: ${line.trim()}, abandoning version up`);
                    } else {
                        // Remove the status so we just get a filename.
                        if (match[1] !== 'CHANGELOG.md') {
                            moddedFiles.push(match[1]);
                        } else {
                            changeLogFound = true;
                        }
                    }
                });

                // Ensure that the CHANGELOG.md file is always the last and that it exists!
                if (!changeLogFound) {
                    throw new Error(`Couldn't find the CHANGELOG.md file, abandoning version up`);
                }
                moddedFiles.push(`CHANGELOG.md`);

                // Now we get the new version from the CHANGELOG (*not* the package.json, it may not exist).
                return exec(`cat ${fullPath}${_.last(moddedFiles)}`).then((contents: string) => {
                    // Only interested in the first match for '## v...'
                    const match = contents.match(/^## (v[0-9]\.[0-9]\.[0-9]).+$/m);

                    if (!match) {
                        throw new Error('Cannot find new version for ${repo}-${pr}');
                    }

                    newVersion = match[1];
                }).return(moddedFiles);
            }).then((files: string[]) => {
                // Read each file and base64 encode it.
                return Promise.map(files, (file: string) => {
                    return fs.readFileAsync(`${fullPath}${file}`).call(`toString`, 'base64').then((encoding: string) => {
                        let newFile: EncodedFile = {
                            file,
                            encoding
                        };
                        return newFile;
                    });
                })
            }).then((files: EncodedFile[]) => {
                // We use the Github API to now update every file in our list, ending with the CHANGELOG.md
                // We need this to be the final file updated, as it'll kick off our actual merge.
                //
                // Turn all this into a single method, cleaner.
                // CommitEncodedFile, or something.

                // Get the top level hierarchy for the branch. It includes the files we need.
                return this.gitCall(githubApi.gitdata.getTree, {
                    owner,
                    repo,
                    sha: branchName
                }).then((treeData: any) => {
                    // We need to save the tree data, we'll be modifying it for updates in a moment.

                    // Create a new blob for our files.
                    return Promise.map(files, (file: EncodedFile) => {
                        // Find the relevant entry in the tree.
                        file.treeEntry = _.find(treeData.tree, (treeEntry: any) => {
                            return treeEntry.path === file.file;
                        });

                        if (!file.treeEntry) {
                            throw new Error(`Couldn't find a git tree entry for the file ${file.file}`);
                        }

                        return this.gitCall(githubApi.gitdata.createBlob, {
                            owner,
                            repo,
                            content: file.encoding,
                            encoding: 'base64'
                        }).then((blob: any) => {
                            file.treeEntry.sha = blob.sha;
                        }).return(file);
                    }).then((files: EncodedFile[]) => {
                        // We now have a load of update tree path entries. We write the
                        // data back to Github to get a new SHA for it.
                        const newTree: any[] = [];

                        files.forEach((file: EncodedFile) => {
                            newTree.push({
                                path: file.treeEntry.path,
                                mode: file.treeEntry.mode,
                                type: 'blob',
                                sha: file.treeEntry.sha
                            })
                        });

                        // Now write this new tree and get back an SHA for it.
                        return this.gitCall(githubApi.gitdata.createTree, {
                            owner,
                            repo,
                            tree: newTree,
                            base_tree: treeData.sha
                        });
                    }).then((newTree: any) => {
                        newTreeSha = newTree.sha;

                        // Get the last commit for the branch.
                        return this.gitCall(githubApi.repos.getCommit, {
                            owner,
                            repo,
                            sha: `${branchName}`
                        });
                    }).then((lastCommit: any) => {
                        // We have new tree object, we now want to create a new commit referencing it.
                        return this.gitCall(githubApi.gitdata.createCommit, {
                            owner,
                            repo,
                            message: `${newVersion}`,
                            tree: newTreeSha,
                            parents: [ lastCommit.sha ],
                            committer: {
                                name: 'Versionbot',
                                email: 'versionbot@whaleway.net'
                            }
                        });
                    }).then((commit: any) => {
                        // Finally, we now update the reference to the branch that's changed.
                        // This should kick off the change for status.
                        return this.gitCall(githubApi.gitdata.updateReference, {
                            owner,
                            repo,
                            ref: `heads/${branchName}`,
                            sha: commit.sha,
                            force: false // Not that I'm paranoid...
                        });
                    });
                });
            }).then(() => {
                console.log(`Upped version of ${repoFullName} to ${newVersion}; tagged and pushed.`);
            }).catch((err: Error) => {
                // We post to the PR, informing we couldn't continue the merge.
                console.log(err);
            });
        });
    };
}

// Export the Versionbot to the app.
// We register the Github events we're interested in here.
export function createBot(integration: number): VersionBot {
    if (!(process.env.VERSIONBOT_NAME && process.env.VERSIONBOT_EMAIL)) {
        throw new Error(`'VERSIONBOT_NAME' and 'VERSIONBOT_EMAIL' environment variables need setting`);
    }

    return new VersionBot(process.env.INTEGRATION_ID);
}
