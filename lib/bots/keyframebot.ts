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
        this.logger.log(LogLevel.INFO, `Ping!`);
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
