"use strict";
var Opts = require("node-getopt");
var _ = require("lodash");
var Promise = require("bluebird");
var GithubApi = require('github');
var getopt = new Opts([
    ['r', 'repository=', 'The repo on Github to init. Must be fullname, eg. `<owner>/<repo>`'],
    ['u', 'user=', 'Username of an admin for the repo'],
    ['p', 'password=', 'Password of an admin for the repo'],
    ['h', 'help', 'This help message']
]);
getopt.setHelp("\nUsage: " + process.argv[1].split('/').slice(-1) + " [OPTIONS]\n[[OPTIONS]]\n");
var opt = getopt.parse(process.argv.slice(2));
if (opt.options['help'] || Object.keys(opt.options).length === 0) {
    console.log(getopt.getHelp());
    process.exit(0);
}
if (!opt.options['user']) {
    console.log('\tPlease provide the username of an admin with `--user`');
    process.exit(0);
}
if (!opt.options['password']) {
    console.log('\tPlease provide the password of an admin with `--password`');
    process.exit(0);
}
if (!opt.options['repository']) {
    console.log('\tPlease provide a repository to initialise with `--repository`');
    process.exit(0);
}
var githubApi = new GithubApi({
    protocol: 'https',
    host: 'api.github.com',
    headers: {
        'Accept': 'application/vnd.github.loki-preview+json'
    },
    Promise: Promise,
    timeout: 5000
});
githubApi.authenticate({
    type: 'basic',
    username: opt.options['user'],
    password: opt.options['password']
});
var owner = opt.options['repository'].split('/')[0];
var repo = opt.options['repository'].split('/')[1];
if (!owner || !repo) {
    console.log('\tThe repository name passed in was invalid');
    console.log(getopt.getHelp());
    process.exit(0);
}
console.log("\tChecking repository " + opt.options['repository'] + "...");
Promise.all([
    githubApi.repos.getProtectedBranchRequiredStatusChecks({
        owner: owner,
        repo: repo,
        branch: 'master'
    }),
    githubApi.repos.getProtectedBranchPullRequestReviewEnforcement({
        owner: owner,
        repo: repo,
        branch: 'master'
    })
]).then(function (protections) {
    var statusChecks = protections[0];
    var reviewChecks = protections[1];
    var contexts = statusChecks.contexts;
    if (!statusChecks || !contexts) {
        return { update: true, contexts: contexts };
    }
    if (!statusChecks.include_admins) {
        return { update: true, contexts: contexts };
    }
    if ((statusChecks.contexts.length < 1) || !_.includes(contexts, 'Versionist')) {
        if (!_.includes(statusChecks.context, 'Versionist')) {
            statusChecks.contexts.push('Versionist');
        }
        return { update: true, contexts: contexts };
    }
    if (!reviewChecks || reviewChecks.include_admins) {
        return { update: true, contexts: contexts };
    }
    return { update: false, contexts: contexts };
}).catch(function (err) {
    var errMessage = JSON.parse(err.message);
    if (errMessage.message !== 'Branch not protected') {
        throw err;
    }
    return { update: true };
}).then(function (updateObj) {
    if (updateObj.update) {
        if (!updateObj.contexts) {
            updateObj.contexts = ['Versionist'];
        }
        var statusChecks = {
            strict: true,
            include_admins: true,
            contexts: updateObj.contexts
        };
        var reviewChecks = {
            include_admins: false
        };
        return githubApi.repos.updateBranchProtection({
            owner: owner,
            repo: repo,
            branch: 'master',
            required_status_checks: statusChecks,
            required_pull_request_reviews: reviewChecks,
            restrictions: null
        }).then(function () {
            console.log("\tBranch protection for " + opt.options['repository'] + " have been set");
        });
    }
    console.log("\tBranch protection for " + opt.options['repository'] + " is already correct");
}).catch(function (err) {
    console.log("\tCouldn't update the protection rights for " + opt.options['repository'] + ":");
    console.log(err.message);
});

//# sourceMappingURL=initRepo.js.map
