import * as Promise from 'bluebird';
import { ProcBot } from '../framework/procbot';
import { GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
export declare class FortuneBot extends ProcBot {
    private githubListenerName;
    private githubEmitterName;
    private githubApi;
    constructor(integration: number, name: string, pemString: string, webhook: string);
    protected tellFortune: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    private githubCall(context);
}
export declare function createBot(): FortuneBot;
