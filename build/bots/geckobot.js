"use strict";
const Promise = require("bluebird");
const _ = require("lodash");
const request = require("request-promise");
const GithubBot = require("./githubbot");
const ProcBot = require("./procbot");
const GeckoBoard = require('geckoboard');
const PR_SET_NAME = 'pullrequests';
const ISSUE_SET_NAME = 'issues';
class GeckoBot extends GithubBot.GithubBot {
    constructor(integration, name) {
        super(integration, name);
        this.datasetPRs = [];
        this.datasetIssues = [];
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
                        if (foundEntry.openprs) {
                            foundEntry.openprs += 1;
                        }
                        else {
                            foundEntry.openprs = 1;
                        }
                    }
                    else {
                        foundEntry = {
                            name: `${name}`,
                            openprs: 1
                        };
                        this.allRepos.push(foundEntry);
                    }
                    this.newPREntriesFromRepos();
                    updateGeckoboard = true;
                    this.log(ProcBot.LogLevel.INFO, `Incremented count for ${owner}/${name}@${new Date().toISOString()}`);
                    break;
                case 'closed':
                    if (foundEntry) {
                        if (foundEntry.openprs) {
                            foundEntry.openprs -= 1;
                        }
                        else {
                            foundEntry.openprs = 0;
                        }
                        this.newPREntriesFromRepos();
                        updateGeckoboard = true;
                        this.log(ProcBot.LogLevel.INFO, `Decremented count for ${owner}/${name}@${new Date().toISOString()}`);
                    }
                    else {
                        this.log(ProcBot.LogLevel.WARN, `Got a closed PR for repo ${owner}/${name} we didn't know about!`);
                    }
                    break;
            }
            if (updateGeckoboard) {
                return this.postPRDataToGeckoboard(this.datasetPRs)
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
        this.updateIssue = (action, data) => {
            const owner = data.repository.owner.login;
            const name = data.repository.name;
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
                        if (foundEntry.openissues) {
                            foundEntry.openissues += 1;
                        }
                        else {
                            foundEntry.openissues = 1;
                        }
                    }
                    else {
                        foundEntry = {
                            name: `${name}`,
                            openprs: 1
                        };
                        this.allRepos.push(foundEntry);
                    }
                    this.newIssueEntriesFromRepos();
                    updateGeckoboard = true;
                    this.log(ProcBot.LogLevel.INFO, `Incremented issue count for ${owner}/${name}@${new Date().toISOString()}`);
                    break;
                case 'closed':
                    if (foundEntry) {
                        if (foundEntry.openissues) {
                            foundEntry.openissues -= 1;
                        }
                        else {
                            foundEntry.openissues = 0;
                        }
                        this.newIssueEntriesFromRepos();
                        updateGeckoboard = true;
                        this.log(ProcBot.LogLevel.INFO, `Decremented issue count for ${owner}/${name}@${new Date().toISOString()}`);
                    }
                    else {
                        this.log(ProcBot.LogLevel.WARN, `Got a closed issue for repo ${owner}/${name} we didn't know about!`);
                    }
                    break;
            }
            if (updateGeckoboard) {
                return this.postIssueDataToGeckoboard(this.datasetIssues)
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
        let knownRepos;
        this.geckoBoard = Promise.promisifyAll(GeckoBoard(process.env.GECKOBOT_GECKO_KEY).datasets);
        this.authenticate().then(() => {
            return Promise.all([
                this.geckoBoard.deleteAsync(PR_SET_NAME),
                this.geckoBoard.deleteAsync(ISSUE_SET_NAME)
            ]);
        }).catch(() => {
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
            knownRepos = repos;
            return Promise.map(knownRepos.repositories, (repo) => {
                return this.getOpenPRsForRepo(repo.owner.login, repo.name);
            });
        }).then((openPRs) => {
            _.each(openPRs, (openPR) => {
                const entry = _.find(this.allRepos, (entry) => entry.name === openPR.name);
                if (entry) {
                    entry.openprs = openPR.openprs;
                }
                else {
                    this.allRepos.push({
                        name: openPR.name,
                        openprs: openPR.openprs
                    });
                }
            });
            this.newPREntriesFromRepos();
            return Promise.map(knownRepos.repositories, (repo) => {
                return this.getOpenIssuesForRepo(repo.owner.login, repo.name);
            });
        }).then((openIssues) => {
            console.log(openIssues);
            _.each(openIssues, (openIssue) => {
                const entry = _.find(this.allRepos, (entry) => entry.name === openIssue.name);
                if (entry) {
                    entry.openissues = openIssue.openissues;
                }
                else {
                    this.allRepos.push({
                        name: openIssue.name,
                        openissues: openIssue.openissues
                    });
                }
            });
            this.newIssueEntriesFromRepos();
            return Promise.all([
                this.postPRDataToGeckoboard(this.datasetPRs),
                this.postIssueDataToGeckoboard(this.datasetIssues)
            ]);
        }).then(() => {
            _.forEach([
                {
                    events: ['pull_request'],
                    name: 'DeterminePRState',
                    workerMethod: this.updatePR
                },
                {
                    events: ['issues'],
                    name: 'DetermineIssueState',
                    workerMethod: this.updateIssue
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
    getOpenIssuesForRepo(owner, repo) {
        const githubApi = this.githubApi;
        let issueCount = 0;
        let pageNumber = 0;
        const pageSize = 100;
        let issueIds = [];
        const getPage = () => {
            console.log(`${repo} get page ${pageNumber}`);
            return this.gitCall(githubApi.issues.getForRepo, {
                owner,
                repo,
                state: 'open',
                per_page: pageSize,
                page: pageNumber
            }).then((results) => {
                console.log(`${repo}: ${results.length}`);
                _.each(results, (result) => {
                    if (!result.pull_request && (result.state === 'open')) {
                        if (_.includes(issueIds, result.id)) {
                            console.log("WE HAVE SEEN THIS ONE BEFORE!");
                        }
                        else {
                            issueCount += 1;
                        }
                    }
                    issueIds.push(result.id);
                });
                console.log(`open issues for ${repo} is now: ${issueCount}`);
                console.log(`results length for ${repo} was ${results.length}`);
                if (results.length === pageSize) {
                    pageNumber += 1;
                    return getPage();
                }
                console.log(`firing for ${repo}, count: ${issueCount}`);
                return {
                    name: `${repo}`,
                    openissues: issueCount,
                    attime: ''
                };
            });
        };
        return getPage();
    }
    newPREntriesFromRepos() {
        const attime = new Date().toISOString();
        _.each(this.allRepos, (repo) => {
            if (repo.openprs) {
                this.datasetPRs.push({
                    name: repo.name,
                    openprs: repo.openprs,
                    attime: attime
                });
            }
        });
    }
    newIssueEntriesFromRepos() {
        const attime = new Date().toISOString();
        _.each(this.allRepos, (repo) => {
            if (repo.openissues) {
                this.datasetIssues.push({
                    name: repo.name,
                    openissues: repo.openissues,
                    attime: attime
                });
            }
        });
    }
    postPRDataToGeckoboard(dataset) {
        return this.geckoBoard.findOrCreateAsync({
            id: PR_SET_NAME,
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
        }).then((dataCalls) => {
            const dataSetPromise = Promise.promisifyAll(dataCalls);
            return dataSetPromise.putAsync(dataset);
        });
    }
    postIssueDataToGeckoboard(dataset) {
        return this.geckoBoard.findOrCreateAsync({
            id: ISSUE_SET_NAME,
            fields: {
                name: {
                    type: 'string',
                    name: 'Repository'
                },
                openissues: {
                    type: 'number',
                    name: 'Open Issues'
                },
                attime: {
                    type: 'datetime',
                    name: 'Date'
                }
            }
        }).then((dataCalls) => {
            const dataSetPromise = Promise.promisifyAll(dataCalls);
            return dataSetPromise.putAsync(dataset);
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
