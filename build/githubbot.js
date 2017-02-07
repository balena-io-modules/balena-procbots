"use strict";
const Promise = require("bluebird");
const GithubApi = require("github");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const request = require("request-promise");
const ProcBot = require("./procbot");
const Worker = require("./worker");
class GithubBot extends ProcBot.ProcBot {
    constructor(integration, name) {
        super(name);
        this.eventTriggers = [];
        this.handleGithubEvent = (event, data) => {
            const labelHead = () => {
                switch (event) {
                    case 'issue_comment':
                    case 'issues':
                        return {
                            number: data.issue.number,
                            repo: data.repository
                        };
                    case 'pull_request':
                    case 'pull_request_review':
                    case 'pull_request_review_comment':
                        return {
                            number: data.pull_request.number,
                            repo: data.repository
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
                        labelPromise = this.gitCall(this.githubApi.issues.getIssueLabels, {
                            number: labelEvent.number,
                            owner: labelEvent.repo.owner.login,
                            repo: labelEvent.repo.name
                        });
                    }
                    labelPromise.then((labels) => {
                        if (labels) {
                            const foundLabels = labels.map((label) => {
                                return label.name;
                            });
                            if (action.suppressionLabels &&
                                (_.intersection(action.suppressionLabels, foundLabels).length ===
                                    action.suppressionLabels.length)) {
                                this.log(ProcBot.LogLevel.INFO, `Dropping '${action.name}' as suppression labels are all present`);
                                return;
                            }
                            if (action.triggerLabels &&
                                (_.intersection(action.triggerLabels, foundLabels).length !==
                                    action.triggerLabels.length)) {
                                this.log(ProcBot.LogLevel.INFO, `Dropping '${action.name}' as not all trigger labels are present`);
                                return;
                            }
                        }
                        return action.workerMethod(action, data).catch((err) => {
                            console.log(err);
                            this.alert(ProcBot.AlertLevel.ERROR, `Error thrown: ${err.message}`);
                        });
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
                    return method(options).then(resolve).catch((err) => {
                        if ((err.message === 'Bad credentials') && !badCreds) {
                            badCreds = true;
                            return this.authenticate().then(runApi());
                        }
                        else if (retriesLeft === 0) {
                            reject(err);
                        }
                        else {
                            setTimeout(runApi, 5000);
                        }
                    });
                };
                runApi();
            });
        };
        this.integrationId = integration;
        this.getWorker = (event) => {
            const context = event.data.repository.full_name;
            let worker = this.workers.get(context);
            if (worker) {
                return worker;
            }
            worker = new Worker.Worker(context, this.removeWorker);
            this.workers.set(context, worker);
            return worker;
        };
        this.githubApi = new GithubApi({
            Promise: Promise,
            headers: {
                Accept: 'application/vnd.github.black-cat-preview+json'
            },
            host: 'api.github.com',
            protocol: 'https',
            timeout: 5000
        });
    }
    firedEvent(event, repoEvent) {
        this.queueEvent({
            event,
            data: repoEvent,
            workerMethod: this.handleGithubEvent
        });
    }
    registerAction(action) {
        this.eventTriggers.push(action);
    }
    authenticate() {
        const privatePem = new Buffer(process.env.PROCBOTS_PEM, 'base64').toString();
        const payload = {
            exp: Math.floor((Date.now() / 1000)) + (10 * 60),
            iat: Math.floor((Date.now() / 1000)),
            iss: this.integrationId
        };
        const jwToken = jwt.sign(payload, privatePem, { algorithm: 'RS256' });
        const installationsOpts = {
            headers: {
                'Accept': 'application/vnd.github.machine-man-preview+json',
                'Authorization': `Bearer ${jwToken}`,
                'User-Agent': 'request'
            },
            json: true,
            url: 'https://api.github.com/integration/installations'
        };
        return request.get(installationsOpts).then((installations) => {
            const tokenUrl = installations[0].access_tokens_url;
            const tokenOpts = {
                headers: {
                    'Accept': 'application/vnd.github.machine-man-preview+json',
                    'Authorization': `Bearer ${jwToken}`,
                    'User-Agent': 'request'
                },
                json: true,
                method: 'POST',
                url: tokenUrl
            };
            return request.post(tokenOpts);
        }).then((tokenDetails) => {
            this.githubApi.authenticate({
                token: tokenDetails.token,
                type: 'token'
            });
            this.log(ProcBot.LogLevel.DEBUG, `token for manual fiddling is: ${tokenDetails.token}`);
            this.log(ProcBot.LogLevel.DEBUG, `token expres at: ${tokenDetails.expires_at}`);
            this.log(ProcBot.LogLevel.DEBUG, 'Base curl command:');
            this.log(ProcBot.LogLevel.DEBUG, `curl -XGET -H "Authorisation: token ${tokenDetails.token}" ` +
                `-H "Accept: application/vnd.github.black-cat-preview+json" https://api.github.com/`);
        });
    }
}
exports.GithubBot = GithubBot;

//# sourceMappingURL=githubbot.js.map
