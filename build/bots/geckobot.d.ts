import * as Promise from 'bluebird';
import * as GithubBotApiTypes from './githubapi-types';
import * as GithubBot from './githubbot';
import { GithubAction } from './githubbot-types';
export declare class GeckoBot extends GithubBot.GithubBot {
    private datasetPRs;
    private datasetIssues;
    private allRepos;
    private geckoBoard;
    constructor(integration: number, name?: string);
    protected updatePR: (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent) => Promise<void>;
    protected updateIssue: (action: GithubAction, data: GithubBotApiTypes.IssueEvent) => Promise<void>;
    private getOpenPRsForRepo(owner, repo);
    private getOpenIssuesForRepo(owner, repo);
    private newPREntriesFromRepos();
    private newIssueEntriesFromRepos();
    private postPRDataToGeckoboard(dataset);
    private postIssueDataToGeckoboard(dataset);
    private reportError(error);
}
export declare function createBot(): GeckoBot;
