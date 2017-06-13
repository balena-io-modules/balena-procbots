import * as Promise from 'bluebird';
import { ProcBot } from '../framework/procbot';
import { GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
export interface KeyframeBotConstructor {
    integrationId: string;
    pem: string;
    webhookSecret: string;
    productRepo: string;
    environments: string;
}
export declare class KeyframeBot extends ProcBot {
    private githubListenerName;
    private githubEmitterName;
    private githubApi;
    private expressApp;
    private environments;
    private productRepo;
    constructor(name: string, constObject: KeyframeBotConstructor);
    protected lintKeyframe: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    private deployKeyframe;
    private createNewEnvironmentBranchCommit;
    private reportError(error);
}
export declare function createBot(): KeyframeBot;
