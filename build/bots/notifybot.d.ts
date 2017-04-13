import * as Promise from 'bluebird';
import { ProcBot } from '../framework/procbot';
import { GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
export interface NotifyBotConfig {
    botName: string;
    githubApp: string;
    githubPEM: string;
    githubSecret: string;
    frontApiKey: string;
    frontUser: string;
}
export declare class NotifyBot extends ProcBot {
    private githubEmitterName;
    private frontEmitterName;
    private frontUser;
    private frontApi;
    private githubApi;
    constructor(config: NotifyBotConfig);
    protected checkPush: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    private tracePRAndNotify(prDetails);
    private matchIssue(text, regExp);
    private getTopicsOnIssue(issueNumber, issueOwner, issueRepo);
    private getNewPRs(component);
    private retrieveFileFromHash(fileRequest);
    private retrieveTopics(topics);
    private getRepoDetails(fullRepo);
    private reportError(error);
}
export declare function createBot(): NotifyBot;
