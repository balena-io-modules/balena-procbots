"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ProcBot = require("./procbot");
var Promise = require("bluebird");
var GithubApi = require('github');
var hmac = require('crypto');
var githubHooks = require('github-webhook-handler');
var jwt = require('jsonwebtoken');
var request = Promise.promisifyAll(require('request'));
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
var GithubBot = (function (_super) {
    __extends(GithubBot, _super);
    function GithubBot(webhooks, integration) {
        var _this = _super.call(this) || this;
        _this._botname = 'GithubBot';
        _this._runsAfter = [];
        _this._webhooks = [];
        _this._webhooks = webhooks;
        _this._github = new GithubAccess(integration);
        _this.log(ProcBot.LogLevel.INFO, 'Construction GithubBot...');
        return _this;
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
    GithubBot.prototype.firedEvent = function (event, repoEvent) {
        console.log('This method should not be called directly.');
    };
    return GithubBot;
}(ProcBot.ProcBot));
exports.GithubBot = GithubBot;
function createBot() {
    return new GithubBot([], 0);
}
exports.createBot = createBot;

//# sourceMappingURL=githubbot.js.map
