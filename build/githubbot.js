"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var GithubApi = require('github');
var hmac = require('crypto');
var githubHooks = require('github-webhook-handler');
var jwt = require('jsonwebtoken');
var request = Promise.promisifyAll(require('request'));
var RepoWorker = (function () {
    function RepoWorker(repoName, parentList) {
        this.queue = [];
        this.repositoryName = repoName;
        this.parentList = parentList;
        this.parentList.push(this);
    }
    Object.defineProperty(RepoWorker.prototype, "repoName", {
        get: function () {
            return this.repositoryName;
        },
        enumerable: true,
        configurable: true
    });
    RepoWorker.prototype.addEvent = function (event, data, worker) {
        this.queue.push({ event: event, data: data, worker: worker });
        if (this.queue.length === 1) {
            this.runWorker();
        }
    };
    RepoWorker.prototype.runWorker = function () {
        var _this = this;
        var entry = this.queue.shift();
        var self = this;
        entry.worker(entry.event, entry.data)
            .then(function () {
            if (_this.queue.length > 0) {
                process.nextTick(_this.runWorker);
            }
            else {
                self.parentList.splice(_.findIndex(self.parentList, self));
            }
        });
    };
    return RepoWorker;
}());
;
;
var GithubAccess = (function () {
    function GithubAccess(integration) {
        this.makeCall = function (method, options, retries) {
            var badCreds = false;
            var retriesLeft = retries || 3;
            return new Promise(function (resolve, reject) {
                var runApi = function () {
                    retriesLeft -= 1;
                    return method(options).catch(function (err) {
                        if ((err.message === 'Bad credentials') && !badCreds) {
                            badCreds = true;
                            return runApi();
                        }
                        else if (retriesLeft === 0) {
                            reject(err);
                        }
                        else {
                            setTimeout(function () {
                                runApi();
                            }, 5000);
                        }
                    }).then(function (data) {
                        resolve(data);
                    });
                };
                runApi();
            });
        };
        this.integrationId = integration;
        this._githubApi = new GithubApi({
            protocol: 'https',
            host: 'api.github.com',
            headers: {
                'Accept': 'application/vnd.github.black-cat-preview+json'
            },
            Promise: Promise,
            timeout: 5000
        });
    }
    Object.defineProperty(GithubAccess.prototype, "githubApi", {
        get: function () {
            return this._githubApi;
        },
        enumerable: true,
        configurable: true
    });
    GithubAccess.prototype.authenticate = function (user) {
        var _this = this;
        var privatePem = new Buffer(process.env.PROCBOTS_PEM, 'base64').toString();
        var payload = {
            iat: Math.floor((Date.now() / 1000)),
            exp: Math.floor((Date.now() / 1000)) + (10 * 60),
            iss: this.integrationId
        };
        console.log(payload);
        var jwToken = jwt.sign(payload, privatePem, { algorithm: 'RS256' });
        var installationsOpts = {
            url: 'https://api.github.com/integration/installations',
            headers: {
                'Authorization': "Bearer " + jwToken,
                'Accept': 'application/vnd.github.machine-man-preview+json',
                'User-Agent': 'request'
            },
            json: true
        };
        if (user) {
            this.user = user;
        }
        return request.getAsync(installationsOpts).then(function (res) {
            var installations = res.body;
            var tokenUrl = installations[0].access_tokens_url;
            var tokenOpts = {
                url: tokenUrl,
                method: 'POST',
                headers: {
                    'Authorization': "Bearer " + jwToken,
                    'Accept': 'application/vnd.github.machine-man-preview+json',
                    'User-Agent': 'request'
                },
                json: true
            };
            if (user) {
                tokenOpts.body = { user_id: user };
            }
            return request.postAsync(tokenOpts);
        }).then(function (res) {
            var tokenDetails = res.body;
            _this._githubApi.authenticate({
                type: 'token',
                token: tokenDetails.token
            });
            console.log("token for manual fiddling is: " + tokenDetails.token);
            console.log('Base curl command:');
            console.log("curl -XGET -H \"Authorisation: token " + tokenDetails.token + "\" -H \"Accept: application/vnd.github.black-cat-preview+json\" https://api.github.com/");
        });
    };
    return GithubAccess;
}());
var GithubBot = (function () {
    function GithubBot(webhooks, integration) {
        this._botname = 'GithubBot';
        this._runsAfter = [];
        this._webhooks = [];
        this.repoWorkers = [];
        this._webhooks = webhooks;
        this._github = new GithubAccess(integration);
    }
    Object.defineProperty(GithubBot.prototype, "botname", {
        get: function () {
            return this._botname;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GithubBot.prototype, "webhooks", {
        get: function () {
            return this._webhooks;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(GithubBot.prototype, "runsAfter", {
        get: function () {
            return this._runsAfter;
        },
        enumerable: true,
        configurable: true
    });
    GithubBot.prototype.queueEvent = function (event) {
        if (!event.workerMethod) {
            console.log("WorkerMethod must be passed into the Githubbot.firedEvent() method");
            return;
        }
        if (!event.repoData) {
            console.log('Could not find a payload or a repository for the event');
            return;
        }
        var repoEntry = _.find(this.repoWorkers, function (entry) {
            if (entry.repoName === event.repoData.full_name) {
                return true;
            }
            return false;
        });
        if (!repoEntry) {
            repoEntry = new RepoWorker(event.repoData.full_name, this.repoWorkers);
        }
        repoEntry.addEvent(event.event, event.repoData, event.workerMethod);
        return;
    };
    GithubBot.prototype.firedEvent = function (event, repoEvent) {
        console.log('This method should not be called directly.');
    };
    return GithubBot;
}());
exports.GithubBot = GithubBot;
function createBot() {
    return new GithubBot([], 0);
}
exports.createBot = createBot;

//# sourceMappingURL=githubbot.js.map
