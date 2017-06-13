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

// VersionBot listens for merges of a PR to the `master` branch and then
// updates any packages for it.
import * as Promise from 'bluebird';
import * as GithubApi from 'github';
import * as _ from 'lodash';
import { ProcBot } from '../framework/procbot';
import { ProcBotConfiguration } from '../framework/procbot-types';
import { GithubCookedData, GithubHandle, GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
import { AlertLevel, LogLevel } from '../utils/logger';

export class VersionBot extends ProcBot {
    /** Github ServiceListener. */
    private githubListenerName: string;
    /** Github ServiceEmitter. */
    private githubEmitterName: string;
    /** Instance of Github SDK API in use. */
    private githubApi: GithubApi;

    constructor(integration: number, name: string, pemString: string, webhook: string) {
        // This is the VersionBot.
        super(name);
        // Create a new listener for Github with the right Integration ID.
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/keyframehooks',
            port: 7788,
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

        // We have two different WorkerMethods here:
        // 1) Status checks on PR open and commits
        // 2) PR review and label checks for merge
        _.forEach([
            {
                events: [ 'pull_request' ],
                listenerMethod: this.lintKeyframe,
                name: 'LintProductKeyframe',
            },
        ], (reg: GithubRegistration) => {
            ghListener.registerEvent(reg);
        });
    }

    protected lintKeyframe = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        const pr = event.cookedEvent.data.pull_request;
        const head = event.cookedEvent.data.pull_request.head;
        const owner = head.repo.owner.login;
        const repo = head.repo.name;
        const prNumber = pr.number;

        this.logger.log(LogLevel.INFO, `Linting ${owner}/${repo}#${prNumber} keyframe for issues`);

        return Promise.resolve();
    }

}

/**
 * Creates a new instance of the VersionBot client.
 */
export function createBot(): VersionBot {
    if (!(process.env.KEYFRAMEBOT_NAME && process.env.KEYFRAMEBOT_INTEGRATION_ID &&
    process.env.KEYFRAMEBOT_PEM && process.env.KEYFRAMEBOT_WEBHOOK_SECRET)) {
        throw new Error(`'KEYFRAMEBOT_NAME', 'KEYFRAMEBOT_INTEGRATION_ID', 'KEYFRAMEBOT_PEM' and ` +
            `'KEYFRAMEBOT_WEBHOOK_SECRET environment variables need setting`);
    }

    return new VersionBot(process.env.KEYFRAMEBOT_INTEGRATION_ID, process.env.KEYFRAMEBOT_NAME,
    process.env.KEYFRAMEBOT_PEM, process.env.KEYFRAMEBOT_WEBHOOK_SECRET);
}
