/*
 Copyright 2016-2017 Resin.io

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

// TobyBot listens for Github Issues, and counts the palindromes in them
//
// To set up, follow the main guide, and define these respective env vars:
// TOBYBOT_WEBHOOK_SECRET
// TOBYBOT_INTEGRATION_ID
// TOBYBOT_PEM
// TOBYBOT_NAME
// TOBYBOT_EMAIL
//
import * as Promise from 'bluebird';
import * as GithubApi from 'github';
import * as _ from 'lodash';
import { ProcBot } from '../framework/procbot';
import {  GithubEmitRequestContext, GithubHandle,
    GithubRegistration } from '../services/github-types';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEvent } from '../services/service-types';
import { LogLevel } from '../utils/logger';

export class TobyBot extends ProcBot {
    /** Github ServiceListener. */
    private githubListenerName: string;
    /** Github ServiceEmitter. */
    private githubEmitterName: string;
    /** Instance of Github SDK API in use. */
    private githubApi: GithubApi;

    /**
     * Constructs a new TobyBot instance.
     * @param integration Github App ID.
     * @param name        Name of the TobyBot.
     * @param pemString   PEM for Github events and App login.
     * @param webhook     Secret webhook for validating events.
     */
    constructor(integration: number, name: string, pemString: string, webhook: string) {
        // This is the TobyBot.
        super(name);

        // Create a new listener for Github with the right Integration ID.
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/webhooks',
            port: 4567,
            type: 'listener',
            webhookSecret: webhook
        });

        // Create a new emitter with the right Integration ID.
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            pem: pemString,
            type: 'emitter'
        });

        // Throw if we didn't get either of the services.
        if (!ghListener) {
            throw new Error("Couldn't create a Github listener");
        }
        if (!ghEmitter) {
            throw new Error("Couldn't create a Github emitter");
        }
        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;

        // Github API handle
        this.githubApi = (<GithubHandle>ghEmitter.apiHandle).github;
        if (!this.githubApi) {
            throw new Error('No Github API instance found');
        }

        // Worker methods, expandable
        _.forEach([
            {
                events: [ 'issues' ],
                listenerMethod: this.checkPalindrome,
                name: 'checkPalindrom'
            }
        ], (reg: GithubRegistration) => {
            ghListener.registerEvent(reg);
        });
    }

    /**
     * Checks a new or updated issue body.
     * 1. Triggered by an `created` event on an Issue (which also happens when
     *    the issue's body is updated)
     * 2. Counts palindrome words in the issue body
     * 3. Checks if the whole issue body is a palindrome
     * 4. Add a comment on the issue with the palindrome count and whole text palindrome
     *
     * @param _registration GithubRegistration object used to register the method
     * @param event         ServiceEvent containing the event information ('pull_request' event)
     * @returns             A void Promise once execution has finished.
     */
    protected checkPalindrome = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        const issue = event.cookedEvent.data.issue;
        const repository = event.cookedEvent.data.repository;
        const ownerLogin = repository.owner.login;
        const name = repository.name;
        const rawbody = event.cookedEvent.data.issue.body;
        const body = rawbody.replace(/:\w+:/, ''); // replace github icons :icon:

        // Test each word for palindromeness
        let palindromeCount: number = 0;
        const bodyWords = body.match(/\b(\w+)\b/g);
        _.forEach(bodyWords,
          (bodyWord) => {
            const lowerCaseWord = bodyWord.toLowerCase();
            if (lowerCaseWord === lowerCaseWord.split('').reverse().join('')) {
              palindromeCount += 1;
            }
        });

        // Correctly pluralize the word palindrome
        let countWord: string = 'palindromes';
        if (palindromeCount === 1) {
          countWord = 'palindrome';
        }

        // Test if the whole issue is a palindrome!
        let palindromeCombo: boolean = false;
        const bodySimplified = body.replace(/\W/g, '').toLowerCase();
        if ( bodySimplified === bodySimplified.split('').reverse().join('') ) {
          palindromeCombo = true;
        }
        this.logger.log(LogLevel.DEBUG, `Comment: ${rawbody}; `+
            `palindrome count: ${palindromeCount}; `+
            `whole palindrome: ${palindromeCombo}`);

        let issueMessage: string = '';
        if (palindromeCombo) {
          issueMessage = `Wow, your whole issue is a palindrome! :1st_place_medal:`;
          if (palindromeCount > 0) {
            issueMessage += `You also have ${palindromeCount} ${countWord} within.`;
          }
        } else {
          issueMessage = `You have ${palindromeCount} ${countWord} in your issue.`;
          if (palindromeCount < 1) {
            issueMessage += `:frowning_face:`;
          } else if (palindromeCount <2) {
            issueMessage += `:+1:`;
          } else {
            issueMessage += `:tada:`;
          }
        }
        return this.dispatchToEmitter(this.githubEmitterName, {
            data: {
                body: issueMessage,
                number: issue.number,
                owner: ownerLogin,
                repo: name,
            },
            method: this.githubApi.issues.createComment
        });
    }
}

/**
 * Creates a new instance of the TobyBot client.
 */
export function createBot(): TobyBot {
    if (!(process.env.TOBYBOT_NAME && process.env.TOBYBOT_EMAIL && process.env.TOBYBOT_INTEGRATION_ID &&
    process.env.TOBYBOT_PEM && process.env.TOBYBOT_WEBHOOK_SECRET)) {
        throw new Error(`'TOBYBOT_NAME', 'TOBYBOT_EMAIL', 'TOBYBOT_INTEGRATION_ID', 'TOBYBOT_PEM' and ` +
            `'TOBYBOT_WEBHOOK_SECRET' environment variables need setting`);
    }

    return new TobyBot(process.env.TOBYBOT_INTEGRATION_ID, process.env.TOBYBOT_NAME,
    process.env.TOBYBOT_PEM, process.env.TOBYBOT_WEBHOOK_SECRET);
}
