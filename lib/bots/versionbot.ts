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
import { FlowdockAdapter } from '../adapters/flowdock';
import * as GithubBotApiTypes from './githubapi-types';
import * as GithubBot from './githubbot';
import { GithubAction, GithubActionRegister } from './githubbot-types';
import * as ProcBot from './procbot';
import { ProcBotConfiguration } from './procbot-types';

// Exec technically has a binding because of it's Node typings, but promisify doesn't include
// the optional object (we need for CWD). So we need to special case it.
const exec: (command: string, options?: any) => Promise<{}> = Promise.promisify(ChildProcess.exec);
const fsReadFile = Promise.promisify(FS.readFile);
const fsFileExists = Promise.promisify(FS.stat);
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
    action: GithubAction;
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

interface VersionBotError {
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

interface VersionBotConfiguration extends ProcBotConfiguration {
    procbot: {
        githubbot: {
            versionbot: {
                minimum_approvals?: number;
                approved_reviewers?: string[];
                maintainers?: string[];
            };
        };
    };
}

type GenericPullRequestEvent = GithubBotApiTypes.PullRequestEvent | GithubBotApiTypes.PullRequestReviewEvent;

const MergeLabel = 'procbots/versionbot/ready-to-merge';
const IgnoreLabel = 'procbots/versionbot/no-checks';

// Te VersionBot is built on top of GithubBot, which does all the heavy lifting and scheduling.
// It is designed to check for valid `versionist` commit semantics and alter (or merge) a PR
// accordingly.
export class VersionBot extends GithubBot.GithubBot {
    // Flowdock Adapter
    private flowdock: FlowdockAdapter;

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
                suppressionLabels: [ IgnoreLabel ],
                workerMethod: this.checkVersioning
            },
            {
                events: [ 'pull_request', 'pull_request_review' ],
                name: 'CheckForReadyMergeState',
                suppressionLabels: [ IgnoreLabel ],
                triggerLabels: [ MergeLabel ],
                workerMethod: this.mergePR,
            },
            // Should a status change occur (Jenkins, VersionBot, etc. all succeed)
            // then check versioning and potentially go to a merge to master.
            {
                events: [ 'status' ],
                name: 'StatusChangeState',
                suppressionLabels: [ IgnoreLabel ],
                triggerLabels: [ MergeLabel ],
                workerMethod: this.statusChange
            }
        ], (reg: GithubActionRegister) => {
            this.registerAction(reg);
        });

        // Create a new Flowdock adapter, should we need one.
        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            this.flowdock = new FlowdockAdapter();
        }

        // Authenticate the Github API.
        this.authenticate();
    }

    // On a status change, we need to see if there's anything to merge.
    protected statusChange = (action: GithubAction, data: GithubBotApiTypes.StatusEvent): Promise<void | void[]> => {
        // We now use the data from the StatusEvent to mock up a PullRequestEvent with enough
        // data to carry out the checks.
        const githubApi = this.githubApi;
        const owner = data.name.split('/')[0];
        const repo = data.name.split('/')[1];
        const commitSha = data.sha;
        const branches = data.branches;

        // If we made the status change, we stop now!
        if (data.context === 'Versionist') {
            return Promise.resolve();
        }

        // Get all PRs for each named branch.
        // We *only* work on open states.
        return Promise.map(branches, (branch) => {
            return this.gitCall(githubApi.pullRequests.getAll, {
                head: `${owner}:${branch.name}`,
                owner,
                repo,
                state: 'open'
            });
        }).then((prs: GithubBotApiTypes.PullRequest[]) => {
            let prEvents: GithubBotApiTypes.PullRequestEvent[] = [];

            // For each PR, attempt to match the SHA to the head SHA. If we get a match
            // we create a new prInfo and then hand them all to another map.
            prs = _.flatten(prs);
            _.each(prs, (pullRequest) => {
                if (pullRequest.head.sha === commitSha) {
                    prEvents.push({
                        action: 'synchronize',
                        pull_request: pullRequest,
                        sender: {
                            login: pullRequest.user.login
                        },
                        type: 'pull_request'
                    });
                }
            });

            // For every one of these, call checkVersioning.
            return Promise.map(prEvents, (event) => {
                return this.checkVersioning(action, event);
            });
        });
    }

    // Checks the newly opened PR and its commits.
    //  1. Triggered by an 'opened' or 'synchronize' event.
    //  2. If any PR commit has a 'Change-Type: <type>' commit, we create a status approving the PR.
    //  3. If no PR commit has a 'Change-Type: <type>' commit, we create a status failing the PR.
    protected checkVersioning = (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent): Promise<void> => {
        const githubApi = this.githubApi;
        const pr = data.pull_request;
        const head = data.pull_request.head;
        const owner = head.repo.owner.login;
        const name = head.repo.name;

        // Only for opened or synced actions.
        if ((data.action !== 'opened') && (data.action !== 'synchronize') &&
            (data.action !== 'labeled')) {
            return Promise.resolve();
        }

        this.log(ProcBot.LogLevel.INFO, `${action.name}: checking version for ${owner}/${name}#${pr.number}`);

        return this.gitCall(githubApi.pullRequests.getCommits, {
            owner,
            number: pr.number,
            repo: name,
        }).then((commits: GithubBotApiTypes.Commit[]) => {
            let changetypeFound: boolean = false;
            // Go through all the commits. We're looking for, at a minimum, a 'change-type:' tag.
            for (let commit of commits) {
                const commitMessage: string = commit.commit.message;

                // Split the commits up into lines, and find the last line with any whitespace in.
                // Whilst we tend to ask for:
                //  <header>
                //
                //  <body>
                //
                //  <footer>
                // This code will actually let you get away with:
                //  <header>
                //
                //  <footer>
                // As sometimes a development patch may be self-explanatory in the header alone.
                const lines = commitMessage.split('\n');
                const lastLine = _.findLastIndex(lines, (line) => line.match(/^\s*$/) );

                // If there's no match, then at the very least there's no footer, and the commit
                // is in the wrong format (as there's no text to use in the logs).
                if (lastLine > 0) {
                    // We should have a line index to join from, now.
                    lines.splice(0, lastLine);
                    const footer = lines.join('\n');
                    const invalidCommit = !footer.match(/^change-type:\s*(patch|minor|major)\s*$/mi);

                    if (!invalidCommit) {
                        changetypeFound = true;
                        break;
                    }
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
                });
            }

            // Else we mark it as having failed and we inform the user directly in the PR.
            this.log(ProcBot.LogLevel.INFO, `${action.name}: No valid 'Change-Type' tag found, failing last commit ` +
                `for ${owner}/${name}#${pr.number}`);
            return this.gitCall(githubApi.repos.createStatus, {
                        context: 'Versionist',
                        description: 'None of the commits in the PR have a `Change-Type` tag',
                        owner,
                        repo: name,
                        sha: head.sha,
                        state: 'failure'
            }).then(() => {
                // We only complain on opening. Either at that point it'll be fixed, or we
                // simply don't pass it in future. This stops the PR being spammed on status changes.
                if (data.action === 'opened') {
                    this.gitCall(githubApi.issues.createComment, {
                        body: `@${data.sender.login}, please ensure that at least one commit contains a` +
                            '`Change-Type:` tag.',
                        owner,
                        number: pr.number,
                        repo: name,
                    });
                }
            });
        }).then(() => {
            // Get the labels for the PR.
            return this.gitCall(this.githubApi.issues.getIssueLabels, {
                number: pr.number,
                owner,
                repo: name
            });
        }).then((labels: GithubBotApiTypes.IssueLabel[]) => {
            // If we don't have a relevant label for merging, we don't proceed.
            if (_.filter(labels, (label) => {
                return label.name === MergeLabel;
            }).length !== 0) {
                return this.gitCall(githubApi.pullRequests.get, {
                    number: pr.number,
                    owner,
                    repo: name
                }).then((mergePr: GithubBotApiTypes.PullRequest) => {
                    return this.finaliseMerge(data, mergePr);
                });
            }
        }).catch((err: Error) => {
            // Call the VersionBot error specific method.
            this.reportError({
                brief: `${process.env.VERSIONBOT_NAME} check failed for ${owner}/${name}#${pr.number}`,
                message: `${process.env.VERSIONBOT_NAME} failed to carry out a status check for the above pull ` +
                    `request here: ${pr.html_url}. The reason for this is:\r\n${err.message}\r\n` +
                    'Please carry out relevant changes or alert an appropriate admin.',
                owner,
                number: pr.number,
                repo: name
            });
        });
    }

    // Merges a PR, if appropriate:
    //  1. Triggered by a 'labeled' event ('procbots/versionbot/ready-to-merge') or a
    //     'pull_request_review_comment'
    //  2. Checks all review comments to ensure that at least one approves the PR (and that no comment
    //     that may come after it includes a 'CHANGES_REQUESTED' state).
    //  3. Commit new version upped files to the branch, which will cause a 'synchronized' event,
    //     which will finalise the merge.
    //
    // It should be noted that this will, of course, result in a 'closed' event on a PR, which
    // in turn will feed into the 'generateVersion' method below.
    protected mergePR = (action: GithubAction, data: GenericPullRequestEvent): Promise<void> => {
        // States for review comments are:
        //  * COMMENT
        //  * CHANGES_REQUESTED
        //  * APPROVED
        //
        // We *only* go through with a merge should:
        //  * The 'procbots/versionbot/ready-to-merge' label appear on the PR issue
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
        let prInfo: GithubBotApiTypes.PullRequest;
        let botConfig: VersionBotConfiguration;

        // Check the action on the event to see what we're dealing with.
        switch (data.action) {
            // Submission is a PR review
            case 'submitted':
            case 'labeled':
                break;

            default:
                // We have no idea what sparked this, but we're not doing anything!
                this.log(ProcBot.LogLevel.DEBUG, `${action.name}:${data.action} isn't a useful action`);
                return Promise.resolve();
        }

        this.log(ProcBot.LogLevel.INFO, `${action.name}: Attempting merge for ${owner}/${repo}#${pr.number}`);

        // There is currently an issue with the Github API where PR reviews cannot be retrieved
        // for private repositories. This means we can't check to ensure an APPROVED review exists
        // before attempting to merge. It has been agreed that, instead, we will await for the
        // maintainer label to be applied instead.
        // The below code needs reinstating once Github fix their API.
        // There's an issue about this here: https://github.com/resin-io-modules/resin-procbots/issues/31
        /*
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
                this.log(ProcBot.LogLevel.INFO, `${action.name}: Unable to merge ${owner}/${repo}#${pr.number}, ` +
                    'no approval comment');
                return Promise.resolve();
            }*/

        // Actually generate a new version of a component:
        // 1. Clone the repo
        // 2. Checkout the appropriate branch given the PR number
        // 3. Run `versionist`
        // 4. Read the `CHANGELOG.md` (and any `package.json`, if present)
        // 5. Base64 encode them
        // 6. Call Github to update them, in serial, CHANGELOG last (important for merging expectations)
        // 7. Finish
        this.log(ProcBot.LogLevel.INFO, `${action.name}: PR is ready to merge, attempting to carry out a ` +
            `version up for ${owner}/${repo}#${pr.number}`);

        return this.getConfiguration(owner, repo).then((config: VersionBotConfiguration) => {
            botConfig = config;

            // Get the branch for this PR.
            return this.gitCall(githubApi.pullRequests.get, {
                number: pr.number,
                owner,
                repo
            });
        }).then((prData: GithubBotApiTypes.PullRequest) => {
            // Get the relevant branch.
            prInfo = prData;
            branchName = prInfo.head.ref;

            // Check to ensure that the PR is actually mergeable. If it isn't, we report this as an
            // error, passing the state.
            if (prInfo.mergeable !== true) {
                throw new Error('The branch cannot currently be merged into master. It has a state of: ' +
                    `\`${prInfo.mergeable_state}\``);
            }

            // Ensure that all the statuses required have passed.
            // If not, an error will be thrown and not proceed any further.
            return this.checkStatuses(prInfo);
        }).then((statusesPassed) => {
            // Finally we have an array of booleans. If any of them are false,
            // statuses aren't valid.
            if (!statusesPassed) {
                throw new Error(`At least one status check has failed; ${process.env.VERSIONBOT_NAME} will not ` +
                    'proceed to update this PR unless forced by re-applying the ' +
                    `\`${MergeLabel}\` label`);
            }

            // Ensure we've not already committed. If we have, we don't wish to do so again.
            return this.getVersionBotCommits(prInfo);
        }).then((commitMessage: string | null) => {
            if (commitMessage) {
                throw new Error(`alreadyCommitted`);
            }

            // If this was a labeling action and there's a config, check to see if there's a maintainers
            // list and ensure the labeler was on it.
            if ((data.action === 'labeled') && (data.type === 'pull_request')) {
                // Note that labeling can only occur on a PRE data, hence casting.
                this.checkValidMaintainer(botConfig, data);
            }

            // Create new work dir.
            return tempMkdir(`${repo}-${pr.number}_`);
        }).then((tempDir: string) => {
            fullPath = `${tempDir}${path.sep}`;

            return this.applyVersionist({
                action,
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
            this.log(ProcBot.LogLevel.INFO, `${action.name}: Upped version of ${repoFullName}#${pr.number} to ` +
                `${newVersion}; tagged and pushed.`);
        }).catch((err: Error) => {
            // Call the VersionBot error specific method if this wasn't the short circuit for
            // committed code.
            if (err.message !== 'alreadyCommitted') {
                this.reportError({
                    brief: `${process.env.VERSIONBOT_NAME} failed to merge ${repoFullName}#${pr.number}`,
                    message: `${process.env.VERSIONBOT_NAME} failed to commit a new version to prepare a merge for ` +
                        `the above pull request here: ${pr.html_url}. The reason for this is:\r\n${err.message}\r\n` +
                        'Please carry out relevant changes or alert an appropriate admin.',
                    owner,
                    number: pr.number,
                    repo
                });
            }
        });
    }

    // Runs versionist and returns the changed files
    private applyVersionist(versionData: VersionistData): Promise<VersionistData> {
        // Clone the repository inside the directory using the commit name and the run versionist.
        // We only care about output from the git status.
        //
        // IMPORTANT NOTE: Currently, Versionist will fail if it doesn't find a
        //     `package.json` file. This means components that don't have one need a custom
        //     `versionist.conf.js` in their root dir. And we need to test to run against it.
        //     It's possible to get round this using a custom `versionist.conf.js`, which we now support.
        const cliCommand = (command: string) => {
            return exec(command, { cwd: versionData.fullPath });
        };

        return Promise.mapSeries([
            `git clone https://${this.authToken}:${this.authToken}@github.com/${versionData.repoFullName} ` +
            `${versionData.fullPath}`,
            `git checkout ${versionData.branchName}`
        ], cliCommand).then(() => {
            // Test the repo, we want to see if there's a local `versionist.conf.js`.
            // If so, we use that rather than the built-in default.
            return fsFileExists(`${versionData.fullPath}/versionist.conf.js`)
            .return(true)
            .catch((err: FSError) => {
                if (err.code !== 'ENOENT') {
                    throw err;
                }

                return false;
            });
        }).then((exists: boolean) => {
            let versionistCommand = 'versionist';
            if (exists) {
                versionistCommand = `${versionistCommand} -c versionist.conf.js`;
                this.log(ProcBot.LogLevel.INFO, `${versionData.action.name}: Found an overriding versionist config ` +
                    `for ${versionData.repoFullName}, using that`);
            }

            return Promise.mapSeries([
                versionistCommand,
                'git status -s'
            ], cliCommand);
        }).get(1).then((status: string) => {
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
                const match = contents.match(/^## (v[0-9]+\.[0-9]+\.[0-9]+).+$/m);

                if (!match) {
                    throw new Error('Cannot find new version for ${repoFullName}-#${pr.number}');
                }

                versionData.version = match[1];
                versionData.files = moddedFiles;
            }).return(versionData);
        });
    }

    // Given files, a tree and repo date, commits the new blobs and updates the head of the branch
    private createCommitBlobs(repoData: RepoFileData): Promise<void> {
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
                        email: process.env.VERSIONBOT_EMAIL,
                        name: process.env.VERSIONBOT_NAME
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
    private mergeToMaster(data: MergeData): Promise<void> {
        const githubApi = this.githubApi;

        return this.gitCall(githubApi.pullRequests.merge, {
            commit_title: `Auto-merge for PR ${data.prNumber} via ${process.env.VERSIONBOT_NAME}`,
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
        }).then(() => {
            // Delete the merge label. This will ensure future updates to the PR are
            // ignored by us.
            return this.gitCall(githubApi.issues.removeLabel, {
                name: MergeLabel,
                number: data.prNumber,
                owner: data.owner,
                repo: data.repoName
            });
        }).then(() => {
            // Get the branch for this PR.
            return this.gitCall(githubApi.pullRequests.get, {
                number: data.prNumber,
                owner: data.owner,
                repo: data.repoName
            });
        }).then((prInfo: GithubBotApiTypes.PullRequest) => {
            // Get the relevant branch.
            const branchName = prInfo.head.ref;

            // Finally delete this branch.
            return this.gitCall(githubApi.gitdata.deleteReference, {
                owner: data.owner,
                ref: `heads/${branchName}`,
                repo: data.repoName
            });
        });
    }

    // Checks the statuses for the given branch (that of a PR).
    // It goes through all the checks and should it find that the
    // last checks for each context have failed, then it will return false
    // else true if all have passed.
    private checkStatuses(prInfo: GithubBotApiTypes.PullRequest): Promise<boolean> {
        // We need to check the branch protection for this repo.
        // Get all the statuses that need to have been satisfied.
        const githubApi = this.githubApi;
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;
        const branch = prInfo.head.ref;
        let contexts: string[] = [];
        let foundStatuses: boolean[] = [];

        return this.gitCall(githubApi.repos.getProtectedBranchRequiredStatusChecks, {
            branch: 'master',
            owner,
            repo
        }).then((statusContexts: GithubBotApiTypes.RequiredStatusChecks) => {
            contexts = statusContexts.contexts;

            // Now get all of the statuses for the master branch.
            return this.gitCall(githubApi.repos.getCombinedStatus, {
                owner,
                ref: branch,
                repo
            });
        }).then((statuses: GithubBotApiTypes.CombinedStatus) => {
            // We go through the statuses and check them off against the contexts.
            // If we get to the end and:
            //  1. Not all of the contexts have been seen
            //  2. Any of them have a state other than 'success'
            // Then the status checks have failed and we throw an error.
            _.each(statuses.statuses, (status) => {
                if (_.includes(contexts, status.context)) {
                    if (status.state === 'success') {
                        foundStatuses.push(true);
                    } else {
                        foundStatuses.push(false);
                    }
                }
            });
            if ((foundStatuses.length !== contexts.length) ||
                _.includes(foundStatuses, false)) {
                return false;
            }

            return true;
        });
    }

    // Has VersionBot already made commits to the branch.
    private getVersionBotCommits(prInfo: GithubBotApiTypes.PullRequest): Promise<string | null> {
        const githubApi = this.githubApi;
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;

        // Get the list of commits for the PR, then get the very last commit SHA.
        return this.gitCall(githubApi.repos.getCommit, {
            owner,
            repo,
            sha: prInfo.head.sha
        }).then((headCommit: GithubBotApiTypes.Commit) => {
            const commit = headCommit.commit;
            const files = headCommit.files;

            if ((commit.committer.name === process.env.VERSIONBOT_NAME) &&
            _.find(files, (file: GithubBotApiTypes.CommitFile) => {
                return file.filename === 'CHANGELOG.md';
            })) {
                return commit.message;
            }

            return null;
        });
    }

    // Actually carry out a merge.
    private finaliseMerge = (data: GithubBotApiTypes.PullRequestEvent,
    prInfo: GithubBotApiTypes.PullRequest): Promise<void> => {
        // We will go ahead and perform a merge if we see VersionBot has:
        // 1. All of the status checks have passed on the repo
        // 2. VersionBot has committed something with 'CHANGELOG.md' in it
        const owner = prInfo.head.repo.owner.login;
        const repo = prInfo.head.repo.name;

        return this.checkStatuses(prInfo).then((statusesPassed) => {
            if (statusesPassed) {
                // Get the list of commits for the PR, then get the very last commit SHA.
                return this.getVersionBotCommits(prInfo).then((commitMessage: string | null) => {
                    if (commitMessage) {
                        // Ensure that the labeler was authorised. We do this here, else we could
                        // end up spamming the PR with errors.
                        return this.getConfiguration(owner, repo).then((config: VersionBotConfiguration) => {
                            // If this was a labeling action and there's a config, check to see if there's a maintainers
                            // list and ensure the labeler was on it.
                            // This throws an error if not.
                            if (data.action === 'labeled') {
                                this.checkValidMaintainer(config, data);
                            }

                            // We go ahead and merge.
                            return this.mergeToMaster({
                                commitVersion: commitMessage,
                                owner,
                                prNumber: prInfo.number,
                                repoName: repo
                            });
                        }).then(() => {
                            // No tags here, just mention it in Flowdock so its searchable.
                            // It's not an error so doesn't need logging.
                            if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
                                const flowdockMessage = {
                                    content: `${process.env.VERSIONBOT_NAME} has now merged the above PR, located ` +
                                        `here: ${prInfo.html_url}.`,
                                    from_address: process.env.VERSIONBOT_EMAIL,
                                    roomId: process.env.VERSIONBOT_FLOWDOCK_ROOM,
                                    source: process.env.VERSIONBOT_NAME,
                                    subject: `${process.env.VERSIONBOT_NAME} merged ${owner}/${repo}#${prInfo.number}`
                                };
                                this.flowdock.postToInbox(flowdockMessage);
                            }
                            this.log(ProcBot.LogLevel.INFO, `MergePR: Merged ${owner}/${repo}#${prInfo.number}`);
                        });
                    }
                });
            }
        });
    }

    private checkValidMaintainer(config: VersionBotConfiguration, event: GithubBotApiTypes.PullRequestEvent): void {
        // If we have a list of valid maintainers, then we need to ensure that if the `ready-to-merge` label
        // was added, that it was by one of these maintainers.
        const maintainers = ((((config || {}).procbot || {}).githubbot || {}).versionbot || {}).maintainers;
        if (maintainers) {
            // Get the user who added the label.
            if (!_.includes(maintainers, event.sender.login)) {
                let errorMessage = `The \`${MergeLabel}\` label was not added by an authorised ` +
                    'maintainer. Authorised maintainers are:\n';
                _.each(maintainers, (maintainer) => errorMessage = errorMessage.concat(`* @${maintainer}\n`));
                throw new Error(errorMessage);
            }
        }
    }

    private getConfiguration(owner: string, repo: string) {
        // We need to get the config file, should it exist.
        return this.retrieveGithubConfiguration(owner, repo).then((configuration: VersionBotConfiguration) => {
            return configuration;
        }).catch((err) => {
            // If it doesn't exist, we'll get a 'Not Found' error back which we just ditch.
            const errMessage = JSON.parse(err.message);
            if (errMessage.message !== 'Not Found') {
                throw err;
            }
        });
    }

    private reportError(error: VersionBotError): void {
        // We create several reports from this error:
        //  * Flowdock team inbox post in the relevant room
        //  * Comment on the PR affected
        //  * Local console log
        const githubApi = this.githubApi;

        if (process.env.VERSIONBOT_FLOWDOCK_ROOM) {
            const flowdockMessage = {
                content: error.message,
                from_address: process.env.VERSIONBOT_EMAIL,
                roomId: process.env.VERSIONBOT_FLOWDOCK_ROOM,
                source: process.env.VERSIONBOT_NAME,
                subject: error.brief,
                tags: [ 'devops' ]
            };
            this.flowdock.postToInbox(flowdockMessage);
        }

        // Post a comment to the relevant PR, also detailing the issue.
        this.gitCall(githubApi.issues.createComment, {
            body: error.message,
            number: error.number,
            owner: error.owner,
            repo: error.repo
        });

        this.alert(ProcBot.AlertLevel.ERROR, error.message);
    }
}

// Export the VersionBot to the app.
// We register the Github events we're interested in here.
export function createBot(): VersionBot {
    if (!(process.env.VERSIONBOT_NAME && process.env.VERSIONBOT_EMAIL)) {
        throw new Error(`'VERSIONBOT_NAME' and 'VERSIONBOT_EMAIL' environment variables need setting`);
    }

    return new VersionBot(process.env.INTEGRATION_ID, process.env.VERSIONBOT_NAME);
}
