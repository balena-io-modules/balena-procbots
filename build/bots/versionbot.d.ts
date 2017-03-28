import * as Promise from 'bluebird';
import { ProcBot } from '../framework/procbot';
import { GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
export declare class VersionBot extends ProcBot {
    private githubListenerName;
    private githubEmitterName;
    private flowdockEmitterName;
    constructor(integration: number, name: string, pemString: string, webhook: string);
    protected statusChange: (registration: GithubRegistration, event: ServiceEvent) => Promise<void | void[]>;
    protected checkVersioning: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    protected mergePR: (_registration: GithubRegistration, event: ServiceEvent) => Promise<void>;
    private applyVersionist(versionData);
    private createCommitBlobs(repoData, githubApi);
    private mergeToMaster(data, githubApiInstance);
    private checkStatuses(prInfo, githubApiInstance);
    private getVersionBotCommits(prInfo, githubApiInstance);
    private finaliseMerge;
    private checkValidMaintainer(config, event);
    private getConfiguration(owner, repo, githubApiInstance);
    private reportError(error);
    private githubCall(context);
    private flowdockCall(context);
}
export declare function createBot(): VersionBot;
