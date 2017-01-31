import * as Promise from 'bluebird';
import * as GithubBotApiTypes from './githubapi-types';
import * as GithubBot from './githubbot';
import { GithubAction } from './githubbot-types';
export declare class VersionBot extends GithubBot.GithubBot {
    constructor(integration: number, name?: string);
    protected checkVersioning: (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent) => Promise<any>;
    protected mergePR: (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent | GithubBotApiTypes.PullRequestReviewEvent) => Promise<void>;
    private applyVersionist(versionData);
    private createCommitBlobs(repoData);
    private mergeToMaster(data);
}
export declare function createBot(): VersionBot;
