import { ProcBot } from '../framework/procbot';
export declare class VersionBot extends ProcBot {
    private githubListenerName;
    private githubEmitterName;
    private githubApi;
    constructor(integration: number, name: string, pemString: string, webhook: string);
}
export declare function createBot(): VersionBot;
