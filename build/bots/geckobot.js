"use strict";
const Promise = require("bluebird");
const _ = require("lodash");
const request = require("request-promise");
const GithubBot = require("./githubbot");
const ProcBot = require("./procbot");
const GeckoBoard = require('geckoboard');
class GeckoBot extends GithubBot.GithubBot {
    constructor(integration, name) {
        super(integration, name);
        this.dataset = [];
        this.allRepos = [];
        this.updatePR = (action, data) => {
            const head = data.pull_request.head;
            const owner = head.repo.owner.login;
            const name = head.repo.name;
            let updateGeckoboard = false;
            action = action;
            let foundEntry;
            for (let index = 0; index < this.allRepos.length; index += 1) {
                const entry = this.allRepos[index];
                if (entry.name === `${name}`) {
                    foundEntry = entry;
                    break;
                }
            }
            switch (data.action) {
                case 'opened':
                case 'reopened':
                    if (foundEntry) {
                        foundEntry.openprs += 1;
                    }
                    else {
                        foundEntry = {
                            name: `${name}`,
                            openprs: 1
                        };
                        this.allRepos.push(foundEntry);
                    }
                    this.newEntriesFromRepos();
                    updateGeckoboard = true;
                    this.log(ProcBot.LogLevel.INFO, `Incremented count for ${owner}/${name}@${new Date().toISOString()}`);
                    break;
                case 'closed':
                    if (foundEntry) {
                        foundEntry.openprs -= 1;
                        this.newEntriesFromRepos();
                        updateGeckoboard = true;
                        this.log(ProcBot.LogLevel.INFO, `Decremented count for ${owner}/${name}@${new Date().toISOString()}`);
                    }
                    else {
                        this.log(ProcBot.LogLevel.WARN, `Got a closed PR for repo ${owner}/${name} we didn't know about!`);
                    }
                    break;
            }
            if (updateGeckoboard) {
                return this.postDataToGeckoboard()
                    .catch((err) => {
                    err = err;
                    this.reportError({
                        brief: `${process.env.GECKOBOT_NAME} couldn't do geckoboard`,
                        message: 'Whoops'
                    });
                });
            }
            else {
                return Promise.resolve();
            }
        };
        this.geckoBoard = Promise.promisifyAll(GeckoBoard(process.env.GECKOBOT_GECKO_KEY).datasets);
        this.authenticate().then(() => {
            return this.geckoBoard.deleteAsync('pullrequests');
        }).then(() => {
            const availableRepos = {
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
        }).then((repos) => {
            return Promise.map(repos.repositories, (repo) => {
                return this.getOpenPRsForRepo(repo.owner.login, repo.name);
            });
        }).then((openPRs) => {
            _.each(openPRs, (openPR) => {
                this.allRepos.push({
                    name: openPR.name,
                    openprs: openPR.openprs
                });
            });
            this.newEntriesFromRepos();
            return this.postDataToGeckoboard();
        }).then(() => {
            _.forEach([
                {
                    events: ['pull_request'],
                    name: 'DeterminePRState',
                    workerMethod: this.updatePR
                }
            ], (reg) => {
                this.registerAction(reg);
            });
        });
    }
    getOpenPRsForRepo(owner, repo) {
        const githubApi = this.githubApi;
        return this.gitCall(githubApi.pullRequests.getAll, {
            owner,
            repo,
            state: 'open'
        }).then((results) => {
            return {
                name: `${repo}`,
                openprs: results.length,
                attime: ''
            };
        });
    }
    newEntriesFromRepos() {
        const attime = new Date().toISOString();
        _.each(this.allRepos, (repo) => {
            this.dataset.push({
                name: repo.name,
                openprs: repo.openprs,
                attime: attime
            });
        });
    }
    postDataToGeckoboard() {
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
        }).then((dataset) => {
            const dataSetPromise = Promise.promisifyAll(dataset);
            return dataSetPromise.putAsync(this.dataset);
        });
    }
    reportError(error) {
        this.alert(ProcBot.AlertLevel.ERROR, error.message);
    }
}
exports.GeckoBot = GeckoBot;
function createBot() {
    if (!process.env.GECKOBOT_NAME) {
        throw new Error(`'GeckoBot_NAME' environment variables need setting`);
    }
    return new GeckoBot(process.env.INTEGRATION_ID, process.env.GECKOBOT_NAME);
}
exports.createBot = createBot;

//# sourceMappingURL=geckobot.js.map
