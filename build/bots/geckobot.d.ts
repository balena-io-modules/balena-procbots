import * as Promise from 'bluebird';
import * as GithubBotApiTypes from './githubapi-types';
import * as GithubBot from './githubbot';
import { GithubAction } from './githubbot-types';
export declare class GeckoBot extends GithubBot.GithubBot {
    private dataset;
    private allRepos;
    private geckoBoard;
    constructor(integration: number, name?: string);
    protected updatePR: (action: GithubAction, data: GithubBotApiTypes.PullRequestEvent) => Promise<void>;
    private getOpenPRsForRepo(owner, repo);
    private newEntriesFromRepos();
    private postDataToGeckoboard();
    private reportError(error);
}
export declare function createBot(): GeckoBot;
