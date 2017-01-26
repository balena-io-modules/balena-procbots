"use strict";
const ProcBot = require("./procbot");
const Promise = require("bluebird");
const _ = require("lodash");
const GithubApi = require('github');
const hmac = require('crypto');
const githubHooks = require('github-webhook-handler');
const jwt = require('jsonwebtoken');
const request = Promise.promisifyAll(require('request'));
class GithubBot extends ProcBot.ProcBot {
    constructor(integration) {
        super();
        this.eventTriggers = [];
        this.handleGithubEvent = (event, data) => {
            const labelHead = () => {
                switch (event) {
                    case 'issue_comment':
                    case 'issues':
                        return {
                            repo: data.repository,
                            number: data.issue.number
                        };
                    case 'pull_request':
                    case 'pull_request_review':
                    case 'pull_request_review_comment':
                        return {
                            repo: data.repository,
                            number: data.pull_request.number
                        };
                    default:
                        return;
                }
            };
            _.forEach(this.eventTriggers, (action) => {
                if (_.includes(action.events, event)) {
                    let labelEvent = labelHead();
                    let labelPromise = Promise.resolve();
                    if ((action.triggerLabels || action.suppressionLabels) && labelEvent) {
                        console.log(labelEvent);
                        labelPromise = this.gitCall(this.githubApi.issues.getIssueLabels, {
                            owner: labelEvent.repo.owner.login,
                            repo: labelEvent.repo.name,
                            number: labelEvent.number
                        });
                    }
                    labelPromise.then((labels) => {
                        if (labels) {
                            const foundLabels = labels.map((label) => {
                                return label.name;
                            });
                            console.log(foundLabels);
                            if (action.suppressionLabels &&
                                (_.intersection(action.suppressionLabels, foundLabels).length === action.suppressionLabels.length)) {
                                console.log(_.intersection(action.suppressionLabels, foundLabels));
                                this.log(ProcBot.LogLevel.INFO, `Dropping '${action.name}' as suppression labels are all present`);
                                return;
                            }
                            if (action.triggerLabels &&
                                (_.intersection(action.triggerLabels, foundLabels).length !== action.triggerLabels.length)) {
                                this.log(ProcBot.LogLevel.INFO, `Dropping '${action.name}' as not all trigger labels are present`);
                                return;
                            }
                        }
                        return action.workerMethod(action, data);
                    });
                }
            });
            return Promise.resolve();
        };
        this.gitCall = (method, options, retries) => {
            let badCreds = false;
            let retriesLeft = retries || 3;
            return new Promise((resolve, reject) => {
                const runApi = () => {
                    retriesLeft -= 1;
                    return method(options).catch((err) => {
                        if ((err.message === 'Bad credentials') && !badCreds) {
                            badCreds = true;
                            return runApi();
                        }
                        else if (retriesLeft === 0) {
                            reject(err);
                        }
                        else {
                            setTimeout(() => {
                                runApi();
                            }, 5000);
                        }
                    }).then((data) => {
                        resolve(data);
                    });
                };
                runApi();
            });
        };
        this._botname = 'GithubBot';
        this.integrationId = integration;
        this.getWorker = (event) => {
            const context = event.data.repository.full_name;
            let worker = this.workers.get(context);
            if (worker) {
                return worker;
            }
            worker = new ProcBot.Worker(context, this.workers);
            this.workers.set(context, worker);
            return worker;
        };
        this.githubApi = new GithubApi({
            protocol: 'https',
            host: 'api.github.com',
            headers: {
                'Accept': 'application/vnd.github.black-cat-preview+json'
            },
            Promise: Promise,
            timeout: 5000
        });
    }
    registerAction(action) {
        this.eventTriggers.push(action);
    }
    firedEvent(event, repoEvent) {
        this.queueEvent({
            event: event,
            data: repoEvent,
            workerMethod: this.handleGithubEvent
        });
    }
    authenticate(user) {
        const privatePem = new Buffer(process.env.PROCBOTS_PEM, 'base64').toString();
        const payload = {
            iat: Math.floor((Date.now() / 1000)),
            exp: Math.floor((Date.now() / 1000)) + (10 * 60),
            iss: this.integrationId
        };
        const jwToken = jwt.sign(payload, privatePem, { algorithm: 'RS256' });
        const installationsOpts = {
            url: 'https://api.github.com/integration/installations',
            headers: {
                'Authorization': `Bearer ${jwToken}`,
                'Accept': 'application/vnd.github.machine-man-preview+json',
                'User-Agent': 'request'
            },
            json: true
        };
        if (user) {
            this.user = user;
        }
        return request.getAsync(installationsOpts).then((res) => {
            const installations = res.body;
            const tokenUrl = installations[0].access_tokens_url;
            const tokenOpts = {
                url: tokenUrl,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwToken}`,
                    'Accept': 'application/vnd.github.machine-man-preview+json',
                    'User-Agent': 'request'
                },
                json: true
            };
            if (user) {
                tokenOpts.body = { user_id: user };
            }
            return request.postAsync(tokenOpts);
        }).then((res) => {
            const tokenDetails = res.body;
            this.githubApi.authenticate({
                type: 'token',
                token: tokenDetails.token
            });
            console.log(`token for manual fiddling is: ${tokenDetails.token}`);
            console.log('Base curl command:');
            console.log(`curl -XGET -H "Authorisation: token ${tokenDetails.token}" -H "Accept: application/vnd.github.black-cat-preview+json" https://api.github.com/`);
        });
    }
}
exports.GithubBot = GithubBot;
function createBot() {
    return new GithubBot(0);
}
exports.createBot = createBot;

//# sourceMappingURL=githubbot.js.map
