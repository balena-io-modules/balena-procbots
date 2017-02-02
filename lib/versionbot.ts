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
import * as Promise from 'bluebird';
import * as ChildProcess from 'child_process';
import * as FS from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import { mkdir, track } from 'temp';
import * as GithubBotApiTypes from './githubapi-types';
import * as GithubBot from './githubbot';
import { GithubAction, GithubActionRegister } from './githubbot-types';
import * as ProcBot from './procbot';

// Exec technically has a binding because of it's Node typings, but promisify doesn't include
// the optional object (we need for CWD). So we need to special case it.
const exec: (command: string, options?: any) => Promise<{}> = Promise.promisify(ChildProcess.exec);
const fsReadFile = Promise.promisify(FS.readFile);
const tempMkdir = Promise.promisify(mkdir);
const tempCleanup = Promise.promisify(track);

// Specific to VersionBot
interface FileMapping {
    file: string;
    encoding: string;
}

interface EncodedFile extends FileMapping {
    treeEntry: GithubBotApiTypes.TreeEntry;
    blobSha: string;
};

interface RepoFileData {
    owner: string;
    repo: string;
    branchName: string;
    version: string;
    files: FileMapping[];
}

interface VersionistData {
    branchName: string;
    fullPath: string;
    repoFullName: string;
    files?: string[];
    version?: string;
}

interface MergeData {
    commitVersion: string;
    owner: string;
    prNumber: number;
    repoName: string;
}

// The VersionBot is built on top of GithubBot, which does all the heavy lifting and scheduling.
// It is designed to check for valid `versionist` commit semantics and alter (or merge) a PR
// accordingly.
export class VersionBot extends GithubBot.GithubBot {

    // Name ourself and register the events and labels we're interested in.
    constructor(integration: number, name?: string) {
        // This is the VersionBot.
        super(integration, name);

        // We have two different WorkerMethods here:
        // 1) Status checks on PR open and commits
        // 2) PR review and label checks for merge
        _.forEach([
            {
                events: [ 'pull_request' ],
                name: 'CheckVersionistCommitStatus',
                suppressionLabels: [ 'flow/no-version-checks' ],
                workerMethod: this.checkVersioning
            },
            {
                events: [ 'pull_request' ],
                name: 'CheckVersionistCommitStatus',
                suppressionLabels: [ 'flow/no-version-checks' ],
                triggerLabels: [ 'version/check-commits' ],
                workerMethod: this.checkVersioning
            },
            {
                events: [ 'pull_request', 'pull_request_review' ],
                name: 'CheckForReadyMergeState',
                suppressionLabels: [ 'flow/no-version-checks' ],
                triggerLabels: [ 'flow/ready-to-merge' ],
                workerMethod: this.mergePR,
            }
        ], (reg: GithubActionRegister) => {
            this.registerAction(reg);
        });

        // Authenticate the Github API.
        this.authenticate();
    }

    // Checks the newly opened PR and its commits.
    //  1. Triggered by an 'opened' or 'synchronize' event.
    //  2. If any PR commit has a 'Change-Type: <type>' commit, we create a status approving the PR.
    //  3. If no PR commit has a 'Change-Type: <type>' commit, we create a status failing the PR.
    protected checkVersioning = (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent) => {
        const githubApi = this.githubApi;
        const pr = data.pull_request;
        const head = data.pull_request.head;
        const owner = head.repo.owner.login;
        const name = head.repo.name;

        this.log(ProcBot.LogLevel.DEBUG, `${action.name}: entered`);

        // Only for opened or synced actions.
        if ((data.action !== 'opened') && (data.action !== 'synchronize') &&
            (data.action !== 'labeled')) {
            return Promise.resolve();
        }

        return this.gitCall(githubApi.pullRequests.getCommits, {
            owner,
            number: pr.number,
            repo: name,
        }).then((commits: GithubBotApiTypes.Commit[]) => {
            let changetypeFound: boolean = false;
            // Go through all the commits. We're looking for, at a minimum, a 'change-type:' tag.
            for (let commit of commits) {
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
                    context: 'Versionist',
                    description: 'Found a valid Versionist `Change-Type` tag',
                    owner,
                    repo: name,
                    sha: head.sha,
                    state: 'success'
                }).return(true);
            }

            // Else we mark it as having failed.
            this.log(ProcBot.LogLevel.DEBUG, `${action.name}: No valid 'Change-Type' tag found, failing last commit`);
            return this.gitCall(githubApi.repos.createStatus, {
                context: 'Versionist',
                description: 'None of the commits in the PR have a `Change-Type` tag',
                owner,
                repo: name,
                sha: head.sha,
                state: 'failure'
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
            });
        }).then((headCommit: GithubBotApiTypes.Commit) => {
            // We will go ahead and perform a merge if we see Versionbot has committed
            // something with 'CHANGELOG.md' in it.
            const commit = headCommit.commit;
            const files = headCommit.files;

            if ((commit.committer.name === process.env.VERSIONBOT_NAME) &&
            _.find(files, (file: GithubBotApiTypes.CommitFile) => {
                return file.filename === 'CHANGELOG.md';
            })) {
                // We go ahead and merge.
                return this.mergeToMaster({
                    commitVersion: commit.message,
                    owner,
                    prNumber: pr.number,
                    repoName: name
                });
            }
        });
    }

    // Merges a PR, if appropriate:
    //  1. Triggered by a 'labeled' event ('flow/ready-to-merge') or a 'pull_request_review_comment'
    //  2. Checks all review comments to ensure that at least one approves the PR (and that no comment
    //     that may come after it includes a 'CHANGES_REQUESTED' state).
    //  3. Commit new version upped files to the branch, which will cause a 'synchronized' event,
    //     which will finalise the merge.
    //
    // It should be noted that this will, of course, result in a 'closed' event on a PR, which
    // in turn will feed into the 'generateVersion' method below.
    protected mergePR = (action: GithubAction,
        data: GithubBotApiTypes.PullRequestEvent | GithubBotApiTypes.PullRequestReviewEvent) => {
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
        let newVersion: string;
        let fullPath: string;
        let branchName: string;

        this.log(ProcBot.LogLevel.DEBUG, `${action.name}: entered`);

        // Check the action on the event to see what we're dealing with.
        switch (data.action) {
            // Submission is a PR review
            case 'submitted':
            case 'labeled':
            case 'unlabeled':
                break;

            default:
                // We have no idea what sparked this, but we're not doing anything!
                this.log(ProcBot.LogLevel.INFO, `${action.name}:${data.action} isn't a useful action`);
                return Promise.resolve();
        }

        // Get the reviews for the PR.
        return this.gitCall(githubApi.pullRequests.getReviews, {
            number: pr.number,
            owner,
            repo
        }).then((reviews: GithubBotApiTypes.Review[]) => {
            // Cycle through reviews, ensure that any approved review occurred after any requiring changes.
            let approved = false;
            if (reviews) {
                reviews.forEach((review: GithubBotApiTypes.Review) => {
                    if (review.state === 'APPROVED') {
                        approved = true;
                    } else if (review.state === 'CHANGES_REQUESTED') {
                        approved = false;
                    }
                });
            }

            if (approved === false) {
                this.log(ProcBot.LogLevel.INFO, `Unable to merge, no approval comment`);
                return Promise.resolve();
            }

            // Actually generate a new version of a component:
            // 1. Clone the repo
            // 2. Checkout the appropriate branch given the PR number
            // 3. Run `versionist`
            // 4. Read the `CHANGELOG.md` (and any `package.json`, if present)
            // 5. Base64 encode them
            // 6. Call Github to update them, in serial, CHANGELOG last (important for merging expectations)
            // 7. Finish
            this.log(ProcBot.LogLevel.INFO, 'PR is ready to merge, attempting to carry out a version up');

            // Get the branch for this PR.
            return this.gitCall(githubApi.pullRequests.get, {
                number: pr.number,
                owner,
                repo
            }).then((prInfo: GithubBotApiTypes.PullRequest) => {
                // Get the relevant branch.
                branchName = prInfo.head.ref;

                // Create new work dir.
                return tempMkdir(`${repo}-${pr.number}_`);
            }).then((tempDir: string) => {
                fullPath = `${tempDir}${path.sep}`;

                return this.applyVersionist({
                    fullPath,
                    branchName,
                    repoFullName
                });
            }).then((versionData: VersionistData) => {
                if (!versionData.version || !versionData.files) {
                    throw new Error('Could not find new version!');
                }
                newVersion = versionData.version;

                // Read each file and base64 encode it.
                return Promise.map(versionData.files, (file: string) => {
                    return fsReadFile(`${fullPath}${file}`).call(`toString`, 'base64')
                    .then((encoding: string) => {
                        let newFile: FileMapping = {
                            file,
                            encoding,
                        };
                        return newFile;
                    });
                });
            }).then((files: FileMapping[]) => {
                return this.createCommitBlobs({
                    owner,
                    repo,
                    branchName,
                    version: newVersion,
                    files
                });
            }).then(() => {
                // Clean up the working directory to free up space.
                // We purposefully don't clean this up on failure, as we can then inspect it.
                return tempCleanup();
            }).then(() => {
                this.log(ProcBot.LogLevel.INFO, `Upped version of ${repoFullName} to ${newVersion}; ` +
                `tagged and pushed.`);
            });
            // Maybe on an error, we should comment on the PR directly?
        });
    }

    // Runs versionist and returns the changed files
    private applyVersionist(versionData: VersionistData) {
        // Clone the repository inside the directory using the commit name and the run versionist.
        // We only care about output from the git status.
        // IMPORTANT NOTE: Currently, Versionist will fail if it doesn't find a
        //     `package.json` file. This means components that don't have one need a custom
        //     `versionist.conf.js` in their root dir. And we need to test to run against it.

        // FIXME, test for component specific versionist.conf.js and use that if it exists.
        return Promise.mapSeries([
            `git clone https://${process.env.WEBHOOK_SECRET}:x-oauth-basic@github.com/${versionData.repoFullName} ` +
            `${versionData.fullPath}`,
            `git checkout ${versionData.branchName}`,
            'versionist',
            'git status -s'
        ], (command) => {
            return exec(command, { cwd: versionData.fullPath });
        }).get(3).then((status: string) => {
            const moddedFiles: string[] = [];
            let changeLines = status.split('\n');
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
            return exec(`cat ${versionData.fullPath}${_.last(moddedFiles)}`).then((contents: string) => {
                // Only interested in the first match for '## v...'
                const match = contents.match(/^## (v[0-9]\.[0-9]\.[0-9]).+$/m);

                if (!match) {
                    throw new Error('Cannot find new version for ${repoFullName}-#${pr.number}');
                }

                versionData.version = match[1];
                versionData.files = moddedFiles;
            }).return(versionData);
        });
    }

    // Given files, a tree and repo date, commits the new blobs and updates the head of the branch
    private createCommitBlobs(repoData: RepoFileData) {
        // We use the Github API to now update every file in our list, ending with the CHANGELOG.md
        // We need this to be the final file updated, as it'll kick off our actual merge.
        //
        // Turn all this into a single method, cleaner.
        // CommitEncodedFile, or something.
        const githubApi = this.githubApi;
        let newTreeSha: string;

        // Get the top level hierarchy for the branch. It includes the files we need.
        return this.gitCall(githubApi.gitdata.getTree, {
            owner: repoData.owner,
            repo: repoData.repo,
            sha: repoData.branchName
        }).then((treeData: GithubBotApiTypes.Tree) => {
            // We need to save the tree data, we'll be modifying it for updates in a moment.

            // Create a new blob for our files.
            // Implicit cast.
            return Promise.map(repoData.files, (file: EncodedFile) => {
                // Find the relevant entry in the tree.
                const treeEntry = _.find(treeData.tree, (entry: GithubBotApiTypes.TreeEntry) => {
                    return entry.path === file.file;
                });

                if (!treeEntry) {
                    throw new Error(`Couldn't find a git tree entry for the file ${file.file}`);
                }

                file.treeEntry = treeEntry;
                return this.gitCall(githubApi.gitdata.createBlob, {
                    content: file.encoding,
                    encoding: 'base64',
                    owner: repoData.owner,
                    repo: repoData.repo
                }).then((blob: GithubBotApiTypes.Blob) => {
                    if (file.treeEntry) {
                        file.treeEntry.sha = blob.sha;
                    }
                }).return(file);
            }).then((blobFiles: EncodedFile[]) => {
                // We now have a load of update tree path entries. We write the
                // data back to Github to get a new SHA for it.
                const newTree: GithubBotApiTypes.TreeEntry[] = [];

                blobFiles.forEach((file: EncodedFile) => {
                    newTree.push({
                        mode: file.treeEntry.mode,
                        path: file.treeEntry.path,
                        sha: file.treeEntry.sha,
                        type: 'blob'
                    });
                });

                // Now write this new tree and get back an SHA for it.
                return this.gitCall(githubApi.gitdata.createTree, {
                    base_tree: treeData.sha,
                    owner: repoData.owner,
                    repo: repoData.repo,
                    tree: newTree
                });
            }).then((newTree: GithubBotApiTypes.Tree) => {
                newTreeSha = newTree.sha;

                // Get the last commit for the branch.
                return this.gitCall(githubApi.repos.getCommit, {
                    owner: repoData.owner,
                    repo: repoData.repo,
                    sha: `${repoData.branchName}`
                });
            }).then((lastCommit: GithubBotApiTypes.Commit) => {
                // We have new tree object, we now want to create a new commit referencing it.
                return this.gitCall(githubApi.gitdata.createCommit, {
                    committer: {
                        email: 'versionbot@whaleway.net',
                        name: 'Versionbot'
                    },
                    message: `${repoData.version}`,
                    owner: repoData.owner,
                    parents: [ lastCommit.sha ],
                    repo: repoData.repo,
                    tree: newTreeSha
                });
            }).then((commit: GithubBotApiTypes.Commit) => {
                // Finally, we now update the reference to the branch that's changed.
                // This should kick off the change for status.
                return this.gitCall(githubApi.gitdata.updateReference, {
                    force: false, // Not that I'm paranoid...
                    owner: repoData.owner,
                    ref: `heads/${repoData.branchName}`,
                    repo: repoData.repo,
                    sha: commit.sha
                });
            });
        });
    }

    // Merges the given PR branch to master, given a commit and repo details.
    private mergeToMaster(data: MergeData) {
        const githubApi = this.githubApi;

        return this.gitCall(githubApi.pullRequests.merge, {
            commit_title: `Auto-merge for PR ${data.prNumber} via Versionbot`,
            number: data.prNumber,
            owner: data.owner,
            repo: data.repoName
        }, 3).then((mergedData: GithubBotApiTypes.Merge) => {
            // We get an SHA back when the merge occurs, and we use this for a tag.
            // Note date gets filed in automatically by API.
            return this.gitCall(githubApi.gitdata.createTag, {
                message: data.commitVersion,
                object: mergedData.sha,
                owner: data.owner,
                repo: data.repoName,
                tag: data.commitVersion,
                tagger: {
                    email: process.env.VERSIONBOT_EMAIL,
                    name: process.env.VERSIONBOT_NAME
                },
                type: 'commit'
            });
        }).then((newTag: GithubBotApiTypes.Tag) => {
            // We now have a SHA back that contains the tag object.
            // Create a new reference based on it.
            return this.gitCall(githubApi.gitdata.createReference, {
                owner: data.owner,
                ref: `refs/tags/${data.commitVersion}`,
                repo: data.repoName,
                sha: newTag.sha
            });
        });
    }
}

// Export the Versionbot to the app.
// We register the Github events we're interested in here.
export function createBot(): VersionBot {
    if (!(process.env.VERSIONBOT_NAME && process.env.VERSIONBOT_EMAIL)) {
        throw new Error(`'VERSIONBOT_NAME' and 'VERSIONBOT_EMAIL' environment variables need setting`);
    }

    return new VersionBot(process.env.INTEGRATION_ID, process.env.VERSIONBOT_NAME);
}
