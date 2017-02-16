import * as Promise from 'bluebird';
import * as GithubBotApiTypes from './githubapi-types';
import * as GithubBot from './githubbot';
import { GithubAction } from './githubbot-types';
export declare class VersionBot extends GithubBot.GithubBot {
    private flowdock;
    constructor(integration: number, name?: string);
    protected statusChange: (action: GithubAction, data: GithubBotApiTypes.StatusEvent) => Promise<void> | Promise<void[]>;
    protected checkVersioning: (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent) => Promise<void>;
    protected mergePR: (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent | GithubBotApiTypes.PullRequestReviewEvent) => Promise<void>;
    private applyVersionist(versionData);
    private createCommitBlobs(repoData);
    private mergeToMaster(data);
    private checkStatuses(prInfo);
    private versionBotCommits(prInfo);
    private finaliseMerge;
    private reportError(error);
}
export declare function createBot(): VersionBot;
