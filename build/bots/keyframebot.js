"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const ChildProcess = require("child_process");
const express = require("express");
const jwtDecode = require("jwt-decode");
const keyframeControl = require("keyfctl");
const _ = require("lodash");
const path = require("path");
const temp_1 = require("temp");
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
const TypedError = require("typed-error");
const resinSdk = require("resin-sdk");
const exec = Promise.promisify(ChildProcess.exec);
const tempMkdir = Promise.promisify(temp_1.track().mkdir);
const tempCleanup = Promise.promisify(temp_1.cleanup);
class HTTPError extends TypedError {
    constructor(code, message) {
        super();
        this.type = 'HttpError';
        this.httpCode = code;
        this.message = message;
    }
}
const GithubPort = 7788;
const DeployKeyframePath = '/deploykeyframe';
const DeployKeyframePort = 7789;
const KeyframeFilename = 'keyframe.yml';
class KeyframeBot extends procbot_1.ProcBot {
    constructor(name, constObject) {
        super(name);
        this.lintKeyframe = (_registration, event) => {
            const cookedEvent = event.cookedEvent;
            const pr = cookedEvent.data.pull_request;
            const head = cookedEvent.data.pull_request.head;
            const owner = head.repo.owner.login;
            const repo = head.repo.name;
            const prNumber = pr.number;
            let branchName = pr.head.ref;
            const authToken = cookedEvent.githubAuthToken;
            let fullPath = '';
            const cliCommand = (command) => {
                return exec(command, { cwd: fullPath });
            };
            if ((event.cookedEvent.data.action !== 'opened') && (event.cookedEvent.data.action !== 'synchronize')) {
                return Promise.resolve();
            }
            this.logger.log(logger_1.LogLevel.INFO, `Linting ${owner}/${repo}#${prNumber} keyframe for issues`);
            return tempMkdir(`keyframebot-${repo}-${pr.number}_`).then((tempDir) => {
                fullPath = `${tempDir}${path.sep}`;
                return Promise.mapSeries([
                    `git clone https://${authToken}:${authToken}@github.com/${owner}/${repo} ${fullPath}`,
                    `git checkout ${branchName}`
                ], cliCommand);
            }).then(() => {
                const baseSha = pr.base.sha;
                const headSha = pr.head.sha;
                return keyframeControl.lint(baseSha, headSha, fullPath);
            }).then((lintResults) => {
                let lintMessage = 'Keyframe linted successfully';
                let commentPromise = Promise.resolve();
                if (!lintResults.valid) {
                    lintMessage = 'Keyframe linting failed';
                    const flattenedErrors = _.flatten(lintResults.messages);
                    let errorMessage = 'The following errors occurred whilst linting the `${KeyframeFilename}` file:\n';
                    _.each(flattenedErrors, (error) => {
                        errorMessage += `${error.message} at line ${error.parsedLine}: ${error.snippet}\n`;
                    });
                    commentPromise = this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            body: errorMessage,
                            owner,
                            repo,
                            number: prNumber,
                        },
                        method: this.githubApi.issues.createComment,
                    });
                }
                return commentPromise.then(() => {
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            context: 'KeyframeBot',
                            description: lintMessage,
                            owner,
                            repo,
                            sha: head.sha,
                            state: (lintResults.valid) ? 'success' : 'failure'
                        },
                        method: this.githubApi.repos.createStatus,
                    });
                });
            }).finally(tempCleanup);
        };
        this.deployKeyframe = (req, res) => {
            const payload = req.body;
            const environment = payload.environment;
            const version = payload.version;
            const headerToken = req.get('Authorization') || '';
            const productSplitRepo = this.productRepo.split('/');
            const productOwner = productSplitRepo[0];
            const productRepo = productSplitRepo[1];
            const resin = resinSdk();
            let decodedToken;
            let owner = '';
            let repo = '';
            let deployDetails;
            const tokenMatch = headerToken.match(/^token (.*)$/i);
            if (!tokenMatch) {
                res.sendStatus(400);
                return;
            }
            const token = tokenMatch[1];
            resin.auth.loginWithToken(token).then(() => {
                try {
                    decodedToken = jwtDecode(token);
                }
                catch (_err) {
                    throw new Error('Cannot decode token into JWT object');
                }
                if (!_.includes(decodedToken.permissions, 'admin.home')) {
                    throw new HTTPError(401, 'Invalid access rights');
                }
                const envRepo = this.environments[environment];
                if (!envRepo) {
                    throw new HTTPError(404, 'Passed environment does not exist');
                }
                const splitRepo = envRepo.split('/');
                owner = splitRepo[0];
                repo = splitRepo[1];
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner: productOwner,
                        repo: productRepo,
                        path: KeyframeFilename,
                        ref: `refs/tags/${version}`
                    },
                    method: this.githubApi.repos.getContent
                });
            }).then((keyframeFile) => {
                if (keyframeFile.encoding !== 'base64') {
                    this.logger.log(logger_1.LogLevel.WARN, `Keyframe file exists for ${productOwner}/${productRepo} but is not ` +
                        `Base64 encoded! Aborting.`);
                    throw new HTTPError(500, 'Keyframe was not correctly encoded');
                }
                deployDetails = {
                    keyframe: keyframeFile,
                    username: decodedToken.username,
                    environment,
                    version,
                    owner,
                    repo
                };
                return this.createNewEnvironmentBranchCommit(deployDetails);
            }).then((branchName) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        title: `Merge product keyframe ${deployDetails.version} into ${deployDetails.environment}`,
                        body: `PR was created via a deployment of the keyframe by Resin admin ${deployDetails.username}.`,
                        head: branchName,
                        base: 'master'
                    },
                    method: this.githubApi.pullRequests.create
                });
            }).then(() => {
                res.sendStatus(200);
            }).catch((err) => {
                let errorCode = (err instanceof HTTPError) ? err.httpCode : 500;
                this.reportError(err);
                res.status(errorCode).send(err.message);
            });
        };
        this.createNewEnvironmentBranchCommit = (branchDetails) => {
            const owner = branchDetails.owner;
            const repo = branchDetails.repo;
            const keyframe = branchDetails.keyframe;
            const environment = branchDetails.environment;
            const version = branchDetails.version;
            const user = branchDetails.username;
            const branchName = `${user}-${version}`;
            ;
            let branchSha = '';
            let keyframeEntry;
            let oldTreeSha = '';
            let newTreeSha = '';
            let commitSha = '';
            const existsMessage = `The branch ${branchName} already exists on the ${environment} environment ` +
                `(${owner}/${repo})`;
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    owner,
                    repo,
                    ref: `heads/${branchName}`
                },
                method: this.githubApi.gitdata.getReference
            }).then(() => {
                throw new HTTPError(409, existsMessage);
            }).catch((err) => {
                if (err.message !== 'Not Found') {
                    if (err.message === existsMessage) {
                        throw err;
                    }
                    throw new HTTPError(409, `Couldn't determine whether a branch could be created for the ` +
                        `${environment} environment (${owner}/${repo})`);
                }
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        ref: 'heads/master'
                    },
                    method: this.githubApi.gitdata.getReference
                });
            }).then((reference) => {
                if (reference.ref !== 'refs/heads/master') {
                    throw new Error(`Master doesn't exist on ${owner}/${repo}`);
                }
                const headSha = reference.object.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        ref: `refs/heads/${branchName}`,
                        sha: headSha
                    },
                    method: this.githubApi.gitdata.createReference
                });
            }).then((reference) => {
                const branchReference = reference.ref;
                branchSha = reference.object.sha;
                if (!branchReference) {
                    throw new HTTPError(500, `Couldn't create the new branch for the ${environment} environment`);
                }
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        sha: branchSha,
                    },
                    method: this.githubApi.gitdata.getTree
                });
            }).then((tree) => {
                keyframeEntry = _.find(tree.tree, (entry) => entry.path === KeyframeFilename);
                if (!keyframeEntry) {
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            owner,
                            repo,
                            ref: `heads/${branchName}`
                        },
                        method: this.githubApi.gitdata.deleteReference
                    }).then(() => {
                        throw new HTTPError(404, `Couldn't find the keyframe file in the ` +
                            `${environment}(${owner}/${repo}) environment`);
                    });
                }
                oldTreeSha = tree.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        content: keyframe.content,
                        encoding: keyframe.encoding
                    },
                    method: this.githubApi.gitdata.createBlob
                });
            }).then((blob) => {
                if (keyframeEntry) {
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            base_tree: oldTreeSha,
                            owner,
                            repo,
                            tree: [{
                                    mode: keyframeEntry.mode,
                                    path: keyframeEntry.path,
                                    sha: blob.sha,
                                    type: 'blob'
                                }]
                        },
                        method: this.githubApi.gitdata.createTree
                    });
                }
            }).then((newTree) => {
                newTreeSha = newTree.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        repo,
                        sha: branchSha
                    },
                    method: this.githubApi.repos.getCommit
                });
            }).then((lastCommit) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        message: `Update keyframe from product version ${version} on behalf of Resin admin ${user}.`,
                        owner,
                        parents: [lastCommit.sha],
                        repo,
                        tree: newTreeSha
                    },
                    method: this.githubApi.gitdata.createCommit
                });
            }).then((commit) => {
                commitSha = commit.sha;
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        force: false,
                        owner,
                        ref: `heads/${branchName}`,
                        repo,
                        sha: commitSha
                    },
                    method: this.githubApi.gitdata.updateReference
                });
            }).then(() => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        message: version,
                        object: commitSha,
                        owner,
                        repo,
                        tag: version,
                        tagger: {
                            name: process.env.KEYFRAMEBOT_NAME,
                            email: 'keyframebot@resin.io'
                        },
                        type: 'commit'
                    },
                    method: this.githubApi.gitdata.createTag
                });
            }).then((newTag) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        owner,
                        ref: `refs/tags/${version}`,
                        repo,
                        sha: newTag.sha
                    },
                    method: this.githubApi.gitdata.createReference
                });
            }).return(branchName);
        };
        const integrationId = constObject.integrationId;
        const pemString = constObject.pem;
        const webhook = constObject.webhookSecret;
        const environments = constObject.environments;
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId,
                pem: pemString,
                type: 'integration'
            },
            path: '/keyframehooks',
            port: GithubPort,
            type: 'listener',
            webhookSecret: webhook
        });
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId,
                pem: pemString,
                type: 'integration'
            },
            pem: pemString,
            type: 'emitter'
        });
        if (!ghListener) {
            throw new Error("Couldn't create a Github listener");
        }
        if (!ghEmitter) {
            throw new Error("Couldn't create a Github emitter");
        }
        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;
        this.githubApi = ghEmitter.apiHandle.github;
        if (!this.githubApi) {
            throw new Error('No Github API instance found');
        }
        try {
            this.environments = JSON.parse(constObject.environments);
        }
        catch (err) {
            throw new Error('There are no valid environments to use');
        }
        this.logger.log(logger_1.LogLevel.INFO, `---> ${name}: Aware of the following environments: ${environments}`);
        this.productRepo = constObject.productRepo;
        this.expressApp = express();
        if (!this.expressApp) {
            throw new Error("Couldn't create an Express application");
        }
        this.expressApp.use(bodyParser.urlencoded({ extended: true }));
        this.expressApp.use(bodyParser.json());
        this.expressApp.post(DeployKeyframePath, this.deployKeyframe);
        this.expressApp.listen(DeployKeyframePort, () => {
            this.logger.log(logger_1.LogLevel.INFO, `---> ${name}: Listening on ${DeployKeyframePort}`);
        });
        _.forEach([
            {
                events: ['pull_request', 'pull_request_review'],
                listenerMethod: this.lintKeyframe,
                name: 'LintKeyframe',
            },
        ], (reg) => {
            ghListener.registerEvent(reg);
        });
    }
    reportError(error) {
        this.logger.alert(logger_1.AlertLevel.ERROR, error.message);
    }
}
exports.KeyframeBot = KeyframeBot;
function createBot() {
    if (!(process.env.KEYFRAMEBOT_NAME && process.env.KEYFRAMEBOT_INTEGRATION_ID &&
        process.env.KEYFRAMEBOT_PEM && process.env.KEYFRAMEBOT_WEBHOOK_SECRET && process.env.KEYFRAMEBOT_PRODUCT_REPO &&
        process.env.KEYFRAMEBOT_ENVIRONMENTS)) {
        throw new Error(`'KEYFRAMEBOT_NAME', 'KEYFRAMEBOT_INTEGRATION_ID', 'KEYFRAMEBOT_PEM', ` +
            `'KEYFRAMEBOT_WEBHOOK_SECRET', 'KEYFRAMEBOT_ENVIRONMENTS' and 'KEYFRAMEBOT_PRODUCT_REPO' environment ` +
            'variables need setting');
    }
    return new KeyframeBot(process.env.KEYFRAMEBOT_NAME, {
        integrationId: process.env.KEYFRAMEBOT_INTEGRATION_ID,
        pem: process.env.KEYFRAMEBOT_PEM,
        webhookSecret: process.env.KEYFRAMEBOT_WEBHOOK_SECRET,
        productRepo: process.env.KEYFRAMEBOT_PRODUCT_REPO,
        environments: process.env.KEYFRAMEBOT_ENVIRONMENTS
    });
}
exports.createBot = createBot;

//# sourceMappingURL=keyframebot.js.map
