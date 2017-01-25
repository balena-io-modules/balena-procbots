"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ProcBot = require("./procbot");
var githubbot_1 = require("./githubbot");
var Promise = require("bluebird");
var _ = require("lodash");
var path = require("path");
var temp = Promise.promisifyAll(require('temp'));
var mkdirp = Promise.promisify(require('mkdirp'));
var rmdir = Promise.promisify(require('rmdir'));
var exec = Promise.promisify(require('child_process').exec);
var fs = Promise.promisifyAll(require('fs'));
var GithubApi = require('github');
var VersionBot = (function (_super) {
    __extends(VersionBot, _super);
    function VersionBot(webhooks, integration) {
        var _this = _super.call(this, webhooks, integration) || this;
        _this.prHandler = function (event, data) {
            var method = Promise.resolve();
            if (event === 'pull_request') {
                switch (data.action) {
                    case 'opened':
                    case 'synchronize':
                        method = _this.checkVersioning(event, data);
                        break;
                    default:
                        method = _this.mergePR(event, data);
                        break;
                }
            }
            else if (event === 'pull_request_review') {
                method = _this.mergePR(event, data);
            }
            return method;
        };
        _this.checkVersioning = function (event, data) {
            var githubApi = _this._github.githubApi;
            var gitCall = _this._github.makeCall;
            var pr = data.pull_request;
            var head = data.pull_request.head;
            var owner = head.repo.owner.login;
            var name = head.repo.name;
            console.log('PR has been opened or synchronised, check for commits');
            return gitCall(githubApi.pullRequests.getCommits, {
                owner: owner,
                repo: name,
                number: pr.number
            }).then(function (commits) {
                var changetypeFound = false;
                for (var index = 0; index < commits.length; index += 1) {
                    var commit = commits[index];
                    var commitMessage = commit.commit.message;
                    var invalidCommit = !commitMessage.match(/^change-type:\s*(patch|minor|major)\s*$/mi);
                    if (!invalidCommit) {
                        changetypeFound = true;
                        break;
                    }
                }
                if (changetypeFound) {
                    return gitCall(githubApi.repos.createStatus, {
                        owner: owner,
                        repo: name,
                        sha: head.sha,
                        state: 'success',
                        description: 'Found a valid Versionist `Change-Type` tag',
                        context: 'Versionist'
                    }).return(true);
                }
                return gitCall(githubApi.repos.createStatus, {
                    owner: owner,
                    repo: name,
                    sha: head.sha,
                    state: 'failure',
                    description: 'None of the commits in the PR have a `Change-Type` tag',
                    context: 'Versionist'
                }).return(false);
            }).then(function () {
                return gitCall(githubApi.repos.getCommit, {
                    owner: owner,
                    repo: name,
                    sha: head.sha
                }).then(function (headCommit) {
                    var commit = headCommit.commit;
                    var files = headCommit.files;
                    if ((commit.committer.name === 'Versionbot') &&
                        _.find(files, function (file) {
                            return file.filename === 'CHANGELOG.md';
                        })) {
                        var commitVersion_1 = commit.message;
                        return gitCall(githubApi.pullRequests.merge, {
                            owner: owner,
                            repo: name,
                            number: pr.number,
                            commit_title: "Auto-merge for PR " + pr.number + " via Versionbot"
                        }, 3).then(function (mergedData) {
                            return gitCall(githubApi.gitdata.createTag, {
                                owner: owner,
                                repo: name,
                                tag: commitVersion_1,
                                message: commitVersion_1,
                                object: mergedData.sha,
                                type: 'commit',
                                tagger: {
                                    name: 'Versionbot',
                                    email: 'versionbot@whaleway.net'
                                }
                            });
                        }).then(function (newTag) {
                            console.log(newTag);
                            return gitCall(githubApi.gitdata.createReference, {
                                owner: owner,
                                repo: name,
                                ref: "refs/tags/" + commitVersion_1,
                                sha: newTag.sha
                            });
                        });
                    }
                });
            });
        };
        _this.mergePR = function (event, data) {
            var githubApi = _this._github.githubApi;
            var gitCall = _this._github.makeCall;
            var pr = data.pull_request;
            var head = data.pull_request.head;
            var owner = head.repo.owner.login;
            var name = head.repo.name;
            var approvePromise = Promise.resolve(false);
            var labelPromise = Promise.resolve(false);
            console.log('PR has been updated with comments or a label');
            var getReviewComments = function () {
                return gitCall(githubApi.pullRequests.getReviews, {
                    owner: owner,
                    repo: name,
                    number: pr.number
                }).then(function (reviews) {
                    var approved = false;
                    reviews.forEach(function (review) {
                        if (review.state === 'APPROVED') {
                            approved = true;
                        }
                        else if (review.state === 'CHANGES_REQUESTED') {
                            approved = false;
                        }
                    });
                    return approved;
                });
            };
            var getLabels = function () {
                return gitCall(githubApi.issues.getIssueLabels, {
                    owner: owner,
                    repo: name,
                    number: pr.number
                }).then(function (labels) {
                    var mergeLabelFound = false;
                    labels.forEach(function (label) {
                        if (label.name === 'flow/ready-to-merge') {
                            mergeLabelFound = true;
                        }
                    });
                    return mergeLabelFound;
                });
            };
            switch (data.action) {
                case 'submitted':
                    if (data.review.state === 'changes_requested') {
                        return Promise.resolve();
                    }
                    else if (data.review.state === 'approved') {
                        approvePromise = Promise.resolve(true);
                    }
                    else {
                        approvePromise = getReviewComments();
                    }
                    labelPromise = getLabels();
                    break;
                case 'labeled':
                case 'unlabeled':
                    if (data.label.name === 'flow/ready-to-merge') {
                        if (data.action === 'unlabeled') {
                            console.log('Label: deleted');
                            return Promise.resolve();
                        }
                        labelPromise = Promise.resolve(true);
                    }
                    else {
                        labelPromise = getLabels();
                    }
                    approvePromise = getReviewComments();
                    break;
                default:
                    console.log("Data action wasn't useful for merging");
                    return Promise.resolve();
            }
            return Promise.all([
                approvePromise,
                labelPromise
            ]).then(function (results) {
                if (!_.includes(results, false)) {
                    return _this.generateVersion(owner, name, pr.number);
                }
                console.log("Unable to merge: PRapproved(" + results[0] + ", Labels(" + results[1] + ")");
            });
        };
        _this.generateVersion = function (owner, repo, pr) {
            console.log('PR is ready to merge, attempting to carry out a version up.');
            var githubApi = _this._github.githubApi;
            var gitCall = _this._github.makeCall;
            var repoFullName = owner + "/" + repo;
            var cwd = process.cwd();
            var newVersion;
            var fullPath;
            var branchName;
            var newTreeSha;
            ;
            return gitCall(githubApi.pullRequests.get, {
                owner: owner,
                repo: repo,
                number: pr
            }).then(function (prInfo) {
                branchName = prInfo.head.ref;
                return temp.mkdirAsync(repo + "-" + pr + "_").then(function (tempDir) {
                    fullPath = "" + tempDir + path.sep;
                    var promiseResults = [];
                    return Promise.mapSeries([
                        "git clone https://" + process.env.WEBHOOK_SECRET + ":x-oauth-basic@github.com/" + repoFullName + " " + fullPath,
                        "git checkout " + branchName,
                        'versionist',
                        'git status -s'
                    ], function (command) {
                        return exec(command, { cwd: fullPath });
                    }).get(3);
                });
            }).then(function (status) {
                var changeLines = status.split('\n');
                var moddedFiles = [];
                var changeLogFound = false;
                if (changeLines.length === 0) {
                    throw new Error("Couldn't find any status changes after running 'versionist', exiting");
                }
                changeLines = _.slice(changeLines, 0, changeLines.length - 1);
                changeLines.forEach(function (line) {
                    var match = line.match(/^\sM\s(.+)$/);
                    if (!match) {
                        throw new Error("Found a spurious git status entry: " + line.trim() + ", abandoning version up");
                    }
                    else {
                        if (match[1] !== 'CHANGELOG.md') {
                            moddedFiles.push(match[1]);
                        }
                        else {
                            changeLogFound = true;
                        }
                    }
                });
                if (!changeLogFound) {
                    throw new Error("Couldn't find the CHANGELOG.md file, abandoning version up");
                }
                moddedFiles.push("CHANGELOG.md");
                return exec("cat " + fullPath + _.last(moddedFiles)).then(function (contents) {
                    var match = contents.match(/^## (v[0-9]\.[0-9]\.[0-9]).+$/m);
                    if (!match) {
                        throw new Error('Cannot find new version for ${repo}-${pr}');
                    }
                    newVersion = match[1];
                }).return(moddedFiles);
            }).then(function (files) {
                return Promise.map(files, function (file) {
                    return fs.readFileAsync("" + fullPath + file).call("toString", 'base64').then(function (encoding) {
                        var newFile = {
                            file: file,
                            encoding: encoding
                        };
                        return newFile;
                    });
                });
            }).then(function (files) {
                return gitCall(githubApi.gitdata.getTree, {
                    owner: owner,
                    repo: repo,
                    sha: branchName
                }).then(function (treeData) {
                    return Promise.map(files, function (file) {
                        file.treeEntry = _.find(treeData.tree, function (treeEntry) {
                            return treeEntry.path === file.file;
                        });
                        if (!file.treeEntry) {
                            throw new Error("Couldn't find a git tree entry for the file " + file.file);
                        }
                        return gitCall(githubApi.gitdata.createBlob, {
                            owner: owner,
                            repo: repo,
                            content: file.encoding,
                            encoding: 'base64'
                        }).then(function (blob) {
                            file.treeEntry.sha = blob.sha;
                        }).return(file);
                    }).then(function (files) {
                        var newTree = [];
                        files.forEach(function (file) {
                            newTree.push({
                                path: file.treeEntry.path,
                                mode: file.treeEntry.mode,
                                type: 'blob',
                                sha: file.treeEntry.sha
                            });
                        });
                        return gitCall(githubApi.gitdata.createTree, {
                            owner: owner,
                            repo: repo,
                            tree: newTree,
                            base_tree: treeData.sha
                        });
                    }).then(function (newTree) {
                        newTreeSha = newTree.sha;
                        return gitCall(githubApi.repos.getCommit, {
                            owner: owner,
                            repo: repo,
                            sha: "" + branchName
                        });
                    }).then(function (lastCommit) {
                        return gitCall(githubApi.gitdata.createCommit, {
                            owner: owner,
                            repo: repo,
                            message: "" + newVersion,
                            tree: newTreeSha,
                            parents: [lastCommit.sha],
                            committer: {
                                name: 'Versionbot',
                                email: 'versionbot@whaleway.net'
                            }
                        });
                    }).then(function (commit) {
                        return gitCall(githubApi.gitdata.updateReference, {
                            owner: owner,
                            repo: repo,
                            ref: "heads/" + branchName,
                            sha: commit.sha,
                            force: false
                        });
                    });
                });
            }).then(function () {
                console.log("Upped version of " + repoFullName + " to " + newVersion + "; tagged and pushed.");
            }).catch(function (err) {
                console.log(err);
            });
        };
        _this._botname = 'VersionBot';
        _this._github.authenticate();
        _this.log(ProcBot.LogLevel.INFO, 'Starting up');
        return _this;
    }
    VersionBot.prototype.firedEvent = function (event, repoEvent) {
        this.queueEvent({
            event: event,
            repoData: repoEvent,
            workerMethod: this.prHandler
        });
    };
    return VersionBot;
}(githubbot_1.GithubBot));
exports.VersionBot = VersionBot;
function createBot(integration) {
    return new VersionBot(['pull_request', 'pull_request_review'], process.env.INTEGRATION_ID);
}
exports.createBot = createBot;

//# sourceMappingURL=versionbot.js.map
