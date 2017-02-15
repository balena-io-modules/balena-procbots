import * as Promise from 'bluebird';
import { GithubActionRegister } from './githubbot-types';
import * as ProcBot from './procbot';
export declare class GithubBot extends ProcBot.ProcBot<string> {
    protected authToken: string;
    protected githubApi: any;
    private integrationId;
    private eventTriggers;
    private ghApiAccept;
    constructor(integration: number, name?: string);
    firedEvent(event: string, repoEvent: any): void;
    protected registerAction(action: GithubActionRegister): void;
    protected handleGithubEvent: (event: string, data: any) => Promise<void>;
    protected authenticate(): Promise<void>;
    protected gitCall: (method: any, options: any, retries?: number | undefined) => Promise<any>;
}
