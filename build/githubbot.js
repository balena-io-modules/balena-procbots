"use strict";
const ProcBot = require("./procbot");
const Promise = require("bluebird");
const GithubApi = require('github');
const hmac = require('crypto');
const githubHooks = require('github-webhook-handler');
const jwt = require('jsonwebtoken');
const request = Promise.promisifyAll(require('request'));
class GithubBot extends ProcBot.ProcBot {
    constructor(integration) {
        super();
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
    firedEvent(event, repoEvent) {
        console.log('This method should not be called directly.');
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
