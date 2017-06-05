import * as Promise from 'bluebird';
import { ProcBot } from '../framework/procbot';
import { GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
export declare class VersionBot extends ProcBot {
    private githubListenerName;
    private githubEmitterName;
    private githubEmitter;
    private githubApi;
    constructor(integration: number, name: string, pemString: string, webhook: string);
    protected statusChange: (registration: GithubRegistration, event: ServiceEvent) => Promise<void | void[]>;
    protected checkWaffleFlow: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    protected addReviewers: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    protected checkReviewers: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    protected checkVersioning: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    protected mergePR: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    private applyVersionist(versionData);
    private createCommitBlobs(repoData);
    private mergeToMaster(data);
    private checkStatuses(prInfo);
    private getVersionBotCommits(prInfo);
    private finaliseMerge;
    private stripPRAuthor(list, pullRequest);
    private checkValidMaintainer(config, event);
    private reportError(error);
}
export declare function createBot(): VersionBot;
