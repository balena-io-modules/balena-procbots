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

// GECKOBOT listens for merges of a PR to the `master` branch and then
// updates any packages for it.
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as request from 'request-promise';
import * as GithubBotApiTypes from './githubapi-types';
import * as GithubBot from './githubbot';
import { GithubAction, GithubActionRegister } from './githubbot-types';
import * as ProcBot from './procbot';
const GeckoBoard = require('geckoboard');

interface GeckoBotError {
    brief: string;
    message: string;
}

interface AvailableRepo {
    name: string;
    owner: {
        login: string;
    }
}

interface RepoArray {
    repositories: AvailableRepo[];
}

interface OpenPREntry {
    name: string;
    openprs: number;
    attime: string;
}

interface RepoTracker {
    name: string;
    openprs: number;
}

// How this works:
// * On startup, we retrieve the details of every single repo we have access to.
//   We then ask how many open PRs each of those repos has.
//   We build a dataset at that point for the datetime.
//   We send it to Geckoboard
// * Whenever a new open/close PR event comes in, we clone the previous data set and then
//   look for the repo in it:
//     - If we don't find it:
//          * We create a new entry (on an open)
//          * We ignore it on a close (shouldn't happen)
//     - If we do find it:
//          * We increment number of PRs on an open
//          * We decrement number of PRs on a close (we do *not* delete, however, as this would
//            ruin the dataset).
export class GeckoBot extends GithubBot.GithubBot {
    private dataset: OpenPREntry[] = [];
    private allRepos: RepoTracker[] = [];
    private geckoBoard: any;

    // Name ourself and register the events and labels we're interested in.
    constructor(integration: number, name?: string) {
        // This is the GECKOBOT.
        super(integration, name);


        // Set login for Geckoboard
        this.geckoBoard = Promise.promisifyAll(GeckoBoard(process.env.GECKOBOT_GECKO_KEY).datasets);

        // Get the initial set of repos and their PRs. We have to do this via an HTTPS request as
        // currently there's no API call for it.
                // Authenticate the Github API.
        this.authenticate().then(() => {
            // Scrub any previous data set entries.
            return this.geckoBoard.deleteAsync('pullrequests');
        }).then(() => {
            const availableRepos: any = {
                headers: {
                    'Accept': 'application/vnd.github.machine-man-preview+json',
                    'Authorization': `token ${this.authToken}`,
                    'User-Agent': 'request'
                },
                json: true,
                method: 'GET',
                url: `https://api.github.com/installation/repositories?access_token=${this.authToken}`
            };
            return request.get(availableRepos);
        }).then((repos: RepoArray) => {
            return Promise.map(repos.repositories, (repo: AvailableRepo) => {
                return this.getOpenPRsForRepo(repo.owner.login, repo.name);
            })
        }).then((openPRs: OpenPREntry[]) => {
            // Push a new key for each repo we know about.
            _.each(openPRs, (openPR) => {
                this.allRepos.push({
                    name: openPR.name,
                    openprs: openPR.openprs
                });
            });
            this.newEntriesFromRepos();

            // We have all our data points and some keys, push the dataset to Geckoboard.
            return this.postDataToGeckoboard();
        }).then(() => {
            // Now we register for events.
            _.forEach([
                {
                    events: [ 'pull_request' ],
                    name: 'DeterminePRState',
                    workerMethod: this.updatePR
                }
            ], (reg: GithubActionRegister) => {
                this.registerAction(reg);
            });
        });
    }


    protected updatePR = (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent): Promise<void> => {
        const head = data.pull_request.head;
        const owner = head.repo.owner.login;
        const name = head.repo.name;
        let updateGeckoboard = false;
        action = action;

        // Try and find an entry for the repo.
        let foundEntry;
        for (let index = 0; index < this.allRepos.length; index += 1) {
            const entry = this.allRepos[index];

            if (entry.name === `${owner}/${name}`) {
                foundEntry = entry;
                break;
            }
        }

        // Depending on what type of action this is, we do several things:
        switch (data.action) {
            case 'opened':
            case 'reopened':
                // Did we find a previous entry?
                if (foundEntry) {
                    foundEntry.openprs += 1;
                } else {
                    foundEntry = {
                        name: `${owner}/${name}`,
                        openprs: 1
                    }
                    this.allRepos.push(foundEntry);
                }

                this.newEntriesFromRepos();
                updateGeckoboard = true;
                break;

            case 'closed':
                if (foundEntry) {
                    foundEntry.openprs -= 1;

                    // Create new data entry.
                    this.newEntriesFromRepos();
                    updateGeckoboard = true;
                } else {
                    // Else we just ignore it, we don't know where this came from.
                    this.log(ProcBot.LogLevel.WARN, `Got a closed PR for repo ${owner}/${name} we didn't know about!`);
                }
                break;
        }

        if (updateGeckoboard) {
            return this.postDataToGeckoboard()
            .catch((err: Error) => {
                // Call the GECKOBOT error specific method.
                err = err;
                this.reportError({
                    brief: `${process.env.GECKOBOT_NAME} couldn't do geckoboard`,
                    message: 'Whoops'
                });
            });
        } else {
            return Promise.resolve();
        }
    }

    private getOpenPRsForRepo(owner: string, repo: string): Promise<OpenPREntry> {
        // Get all open PRs for the repo.
        const githubApi = this.githubApi;

        return this.gitCall(githubApi.pullRequests.getAll, {
            owner,
            repo,
            state: 'open'
        }).then((results: GithubBotApiTypes.PullRequest[]) => {
            return {
                name: `${owner}/${repo}`,
                openprs: results.length,
                attime: ''
            };
        });
    }

    private newEntriesFromRepos() {
        // Go through all the known repos and create new data points.
        const attime = new Date().toISOString();
        _.each(this.allRepos, (repo) => {
            this.dataset.push({
                name: repo.name,
                openprs: repo.openprs,
                attime: attime
            });
        });
    }

    private postDataToGeckoboard(): Promise<void> {
        // Create the dataset (or ensure it exists)
        return this.geckoBoard.findOrCreateAsync({
            id: 'pullrequests',
            fields: {
                name: {
                    type: 'string',
                    name: 'Repository'
                },
                openprs: {
                    type: 'number',
                    name: 'Open PRs'
                },
                attime: {
                    type: 'datetime',
                    name: 'Date'
                }
            }
        }).then((dataset: any) => {
            const dataSetPromise = Promise.promisifyAll(dataset);
            return dataSetPromise.putAsync(this.dataset);
        });
    }

    private reportError(error: GeckoBotError): void {
        // We create several reports from this error:
        //  * Flowdock team inbox post in the relevant room
        //  * Comment on the PR affected
        //  * Local console log
        this.alert(ProcBot.AlertLevel.ERROR, error.message);
    }
}

// Export the GECKOBOT to the app.
// We register the Github events we're interested in here.
export function createBot(): GeckoBot {
    if (!process.env.GECKOBOT_NAME) {
        throw new Error(`'GeckoBot_NAME' environment variables need setting`);
    }

    return new GeckoBot(process.env.INTEGRATION_ID, process.env.GECKOBOT_NAME);
}
