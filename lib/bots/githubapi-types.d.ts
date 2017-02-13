// Github Events --------------------------------------------------------------
// These provide the current bare minimum definitions for child Procbots working with them.
export interface PullRequestEvent {
    action: string;
    pull_request: {
        number: number;
        head: {
            repo: {
                name: string;
                owner: {
                    login: string;
                }
            };
            sha: string;
        };
        html_url: string;
        url: string;
    };
    sender: {
        login: string;
    };
}

export interface PullRequestReviewEvent {
    action: string;
    pull_request: {
        number: number;
        head: {
            repo: {
                name: string;
                owner: {
                    login: string;
                }
            };
            sha: string;
        };
        html_url: string;
        url: string;
    };
}

// Github API -----------------------------------------------------------------
// These provide the current bare minimum definitions for child Procbots working with them.
export interface CommitFile {
    filename: string;
}

export interface Commit {
    commit: {
        committer: {
            name: string
        }
        message: string
    };
    files: CommitFile[];
    sha: string;
}

export interface Review {
    state: string;
}

export interface Merge {
    sha: string;
}

export interface Tag {
    sha: string;
}

export interface PullRequest {
    head: {
        ref: string;
    };
    mergeable: boolean;
    mergeable_state: string;
}

export interface Blob {
    sha: string;
}

export interface TreeEntry {
    path: string;
    mode: string;
    type: string;
    sha: string;
    url?: string;
    size?: number;
}

export interface Tree {
    sha: string;
    url: string;
    tree: TreeEntry[];
}

export interface GithubError {
    message: string;
    documentation_url: string;
}
