/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Import most things with types if possible.
import Opts = require('node-getopt');
import * as _ from 'lodash';
import * as Promise from 'bluebird';

const hmac = require('crypto');
const GithubApi = require('github');

// Arguments determine which bot type we want to use.
const getopt = new Opts([
    [ 'r',	'repository=',  'The repo on Github to init. Must be fullname, eg. `<owner>/<repo>`'],
    [ 'u',	'user=',        'Username of an admin for the repo'],
    [ 'p',	'password=',    'Password of an admin for the repo'],
    [ 'h',	'help',         'This help message']
]);

getopt.setHelp(`
Usage: ${process.argv[1].split('/').slice(-1)} [OPTIONS]
[[OPTIONS]]
`);

// No options, no run.
const opt = getopt.parse(process.argv.slice(2))
if (opt.options['help'] || Object.keys(opt.options).length === 0) {
    console.log(getopt.getHelp());
    process.exit(0)
}

// Ensure we have a user, password and repo.
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

// Create new API instance and authenticate using the user
const githubApi = new GithubApi({
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

// Get the master branch of the named repo.
const owner = opt.options['repository'].split('/')[0];
const repo = opt.options['repository'].split('/')[1];

if (!owner || !repo) {
    console.log('\tThe repository name passed in was invalid')
    console.log(getopt.getHelp());
    process.exit(0)
}

// We need to get both the status checks and the review checks.
console.log(`\tChecking repository ${opt.options['repository']}...`)
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
]).then((protections: any[]) => {
    const statusChecks = protections[0];
    const reviewChecks = protections[1];
    let contexts = statusChecks.contexts;

    // Check the protection currently on the branch, if any of this is missing we'll blanket
    // update.
    // Note we don't currently specifically force review checks on Admins.
    // This is for critical firefighting, which occasionally happens.
    if (!statusChecks || !contexts) {
        return { update: true, contexts };
    }
    // Admins should be included in status checks.
    if (!statusChecks.include_admins) {
        return { update: true, contexts };
    }
    // If the Versionist status isn't included, make sure it is!
    // We play with the contexts object to ensure we don't blow away any other valid contexts.
    if ((statusChecks.contexts.length < 1) || !_.includes(contexts, 'Versionist')) {
        // Ensure that the Versionist context is added.
        if (!_.includes(statusChecks.context, 'Versionist')) {
            statusChecks.contexts.push('Versionist');
        }
        return { update: true, contexts };
    }
    // Needs to be review checks, and admins should *not* be included.
    if (!reviewChecks || reviewChecks.include_admins) {
        return { update: true, contexts };
    }

    return { update: false, contexts };
}).catch((err: Error) => {
    // The returned message is a bit non-standard, so convert.
    const errMessage: any = JSON.parse(err.message);
    if (errMessage.message !== 'Branch not protected') {
        throw err;
    }

    return { update: true };
}).then((updateObj: any) => {
    // We need to specifically update the checks for the branch. Do the lot, regardless
    // of how many were set before.
    if (updateObj.update) {
        if (!updateObj.contexts) {
            updateObj.contexts = [ 'Versionist' ];
        }
        const statusChecks = {
            strict: true,
            include_admins: true,
            contexts: updateObj.contexts
        };
        const reviewChecks = {
            include_admins: false
        };
        return githubApi.repos.updateBranchProtection({
            owner: owner,
            repo: repo,
            branch: 'master',
            required_status_checks: statusChecks,
            required_pull_request_reviews: reviewChecks,
            restrictions: null
        }).then(() => {
            console.log(`\tBranch protection for ${opt.options['repository']} have been set`);
        });
    }

    console.log(`\tBranch protection for ${opt.options['repository']} is already correct`);
}).catch((err: Error) => {
    console.log(`\tCouldn't update the protection rights for ${opt.options['repository']}:`);
    console.log(err.message);
});
