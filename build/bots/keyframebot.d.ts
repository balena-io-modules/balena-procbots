import * as Promise from 'bluebird';
import { ProcBot } from '../framework/procbot';
import { GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
export declare class KeyframeBot extends ProcBot {
    private githubListenerName;
    private githubEmitterName;
    private githubApi;
    private expressApp;
    constructor(integration: number, name: string, pemString: string, webhook: string);
    protected lintKeyframe: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    private deployKeyframe;
    private reportError(error);
}
export declare function createBot(): KeyframeBot;
