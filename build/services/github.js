"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const express = require("express");
const GithubApi = require("github");
const jwt = require("jsonwebtoken");
const _ = require("lodash");
const path = require("path");
const request = require("request-promise");
const TypedError = require("typed-error");
const worker_1 = require("../framework/worker");
const worker_client_1 = require("../framework/worker-client");
const logger_1 = require("../utils/logger");
class GithubError extends TypeError {
    constructor(error) {
        super(error);
        try {
            const data = JSON.parse(error.message);
            this.message = data.message;
            this.documentationUrl = data.documentation_url;
        }
        catch (_err) {
            this.message = error.message;
            this.documentationUrl = '';
        }
    }
}
exports.GithubError = GithubError;
class GithubService extends worker_client_1.WorkerClient {
    constructor(constObj) {
        super();
        this.eventTriggers = [];
        this.ghApiAccept = 'application/vnd.github.loki-preview+json';
        this._serviceName = path.basename(__filename.split('.')[0]);
        this.logger = new logger_1.Logger();
        this.handleGithubEvent = (event) => {
            const labelHead = () => {
                switch (event.cookedEvent.type) {
                    case 'issue_comment':
                    case 'issues':
                        return {
                            number: event.rawEvent.issue.number,
                            repo: event.rawEvent.repository
                        };
                    case 'pull_request':
                    case 'pull_request_review':
                    case 'pull_request_review_comment':
                        return {
                            number: event.rawEvent.pull_request.number,
                            repo: event.rawEvent.repository
                        };
                    default:
                        return;
                }
            };
            return Promise.map(this.eventTriggers, (registration) => {
                if (_.includes(registration.events, event.cookedEvent.type)) {
                    let labelEvent = labelHead();
                    let labelPromise = Promise.resolve({ source: this._serviceName });
                    if ((registration.triggerLabels || registration.suppressionLabels) && labelEvent) {
                        const request = {
                            contexts: {},
                            source: this._serviceName
                        };
                        request.contexts[this._serviceName] = {
                            data: {
                                number: labelEvent.number,
                                owner: labelEvent.repo.owner.login,
                                repo: labelEvent.repo.name
                            },
                            method: this.githubApi.issues.getIssueLabels
                        };
                        labelPromise = this.sendData(request);
                    }
                    labelPromise.then((data) => {
                        const labels = data.response;
                        if (labels) {
                            const foundLabels = labels.map((label) => {
                                return label.name;
                            });
                            if (registration.suppressionLabels &&
                                (_.intersection(registration.suppressionLabels, foundLabels).length ===
                                    registration.suppressionLabels.length)) {
                                this.logger.log(logger_1.LogLevel.DEBUG, `Dropping '${registration.name}' as suppression labels are all present`);
                                return;
                            }
                            if (registration.triggerLabels &&
                                (_.intersection(registration.triggerLabels, foundLabels).length !==
                                    registration.triggerLabels.length)) {
                                this.logger.log(logger_1.LogLevel.DEBUG, `Dropping '${registration.name}' as not all trigger labels are present`);
                                return;
                            }
                        }
                        return registration.listenerMethod(registration, event);
                    }).catch((err) => {
                        this.logger.alert(logger_1.AlertLevel.ERROR, `Error thrown in main event/label filter loop:${err}`);
                    });
                }
            }).return();
        };
        if (constObj.loginType.type !== 'integration') {
            throw new Error('Do not yet support non-Integration type clients');
        }
        constObj.loginType = constObj.loginType;
        this.integrationId = constObj.loginType.integrationId;
        this.pem = constObj.loginType.pem;
        this.githubApi = new GithubApi({
            Promise: Promise,
            headers: {
                Accept: this.ghApiAccept
            },
            host: 'api.github.com',
            protocol: 'https',
            timeout: 20000
        });
        this.authenticate();
        if (constObj.type === 'listener') {
            const listenerConstructor = constObj;
            this.getWorker = (event) => {
                const repository = event.data.rawEvent.repository;
                let context = '';
                if (repository) {
                    context = repository.full_name;
                }
                else {
                    context = 'generic';
                }
                let worker = this.workers.get(context);
                if (worker) {
                    return worker;
                }
                worker = new worker_1.Worker(context, this.removeWorker);
                this.workers.set(context, worker);
                return worker;
            };
            function verifyWebhookToken(payload, hubSignature) {
                const newHmac = crypto.createHmac('sha1', listenerConstructor.webhookSecret);
                newHmac.update(payload);
                if (('sha1=' + newHmac.digest('hex')) === hubSignature) {
                    return true;
                }
                return false;
            }
            let app;
            if (listenerConstructor.express) {
                app = listenerConstructor.express;
            }
            else {
                app = express();
                app.use(bodyParser.urlencoded({ extended: true }));
                app.use(bodyParser.json());
            }
            app.post(listenerConstructor.path, (req, res) => {
                const eventType = req.get('x-github-event');
                const payload = req.body;
                if (!verifyWebhookToken(JSON.stringify(payload), req.get('x-hub-signature'))) {
                    res.sendStatus(401);
                    return;
                }
                res.sendStatus(200);
                this.queueEvent({
                    data: {
                        cookedEvent: {
                            data: payload,
                            githubAuthToken: this.authToken,
                            type: eventType
                        },
                        rawEvent: payload,
                        source: this._serviceName
                    },
                    workerMethod: this.handleGithubEvent
                });
            });
            if (!listenerConstructor.express) {
                app.listen(listenerConstructor.port, () => {
                    this.logger.log(logger_1.LogLevel.INFO, `---> ${listenerConstructor.client}: Listening Github Service on ` +
                        `':${listenerConstructor.port}${listenerConstructor.path}'`);
                });
            }
        }
    }
    registerEvent(registration) {
        this.eventTriggers.push(registration);
    }
    sendData(data) {
        const emitContext = _.pickBy(data.contexts, (_val, key) => {
            return key === this._serviceName;
        });
        const githubContext = _.cloneDeep(emitContext.github);
        let retriesLeft = 3;
        let returnArray = [];
        let perPage = githubContext.data['per_page'] || 30;
        let page = githubContext.data.page || 1;
        const runApi = () => {
            retriesLeft -= 1;
            return githubContext.method(githubContext.data).then((resData) => {
                let response = resData;
                if (Array.isArray(resData)) {
                    returnArray = _.concat(returnArray, resData);
                    retriesLeft += 1;
                    if (!githubContext.data.page) {
                        githubContext.data.page = page;
                    }
                    if (!githubContext.data['per_page']) {
                        githubContext.data['per_page'] = perPage;
                    }
                    githubContext.data.page++;
                    if (resData.length === perPage) {
                        return runApi();
                    }
                    response = _.uniqBy(returnArray, 'url');
                }
                return {
                    response,
                    source: this._serviceName
                };
            }).catch((error) => {
                let err = new GithubError(error);
                if (err.message.indexOf('504: Gateway Timeout') !== -1) {
                    return {
                        err: new TypedError('Github API timed out, could not complete'),
                        source: this._serviceName
                    };
                }
                else {
                    if ((retriesLeft < 1) || (err.message === 'Not Found')) {
                        return {
                            err: new TypedError(err),
                            source: this._serviceName
                        };
                    }
                    else {
                        if (err.message === 'Bad credentials') {
                            return this.authenticate().then(runApi);
                        }
                        else {
                            return Promise.delay(5000).then(runApi);
                        }
                    }
                }
            });
        };
        return runApi();
    }
    get serviceName() {
        return this._serviceName;
    }
    get apiHandle() {
        return {
            github: this.githubApi
        };
    }
    authenticate() {
        const privatePem = new Buffer(this.pem, 'base64').toString();
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
            this.authToken = tokenDetails.token;
            this.githubApi.authenticate({
                token: this.authToken,
                type: 'token'
            });
            this.logger.log(logger_1.LogLevel.INFO, `token for manual fiddling is: ${tokenDetails.token}`);
            this.logger.log(logger_1.LogLevel.INFO, `token expires at: ${tokenDetails.expires_at}`);
            this.logger.log(logger_1.LogLevel.INFO, 'Base curl command:');
            this.logger.log(logger_1.LogLevel.INFO, `curl -XGET -H "Authorisation: token ${tokenDetails.token}" ` +
                `-H "Accept: ${this.ghApiAccept}" https://api.github.com/`);
        });
    }
}
exports.GithubService = GithubService;
function createServiceListener(constObj) {
    return new GithubService(constObj);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(constObj) {
    return new GithubService(constObj);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=github.js.map
