// Github Events --------------------------------------------------------------
// These provide the current bare minimum definitions for child Procbots working with them.
export interface PullRequestEvent {
    type: 'pull_request';
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
    type: 'pull_request_review';
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

export interface StatusEventBranch {
    name: string;
    commit: {
        author: {
            login: string;
        }
        sha: string;
        url: string;
    };
}

export interface StatusEvent {
    context: string;
    name: string;
    sha: string;
    branches: StatusEventBranch[];
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
        repo: {
            owner: {
                login: string;
            }
            name: string;
        };
        sha: string;
    };
    html_url: string;
    mergeable: boolean;
    mergeable_state: string;
    number: number;
    url: string;
    user: {
        login: string;
    };
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

export interface RequiredStatusChecks {
    include_admins: boolean;
    strict: boolean;
    contexts: string[];
}

export interface IssueLabel {
    default: boolean;
    id: string;
    name: string;
}

export interface Status {
    state: string;
    context: string;
}

export interface CombinedStatus {
    state: string;
    total_count: number;
    statuses: Status[];
}

export interface GithubError {
    message: string;
    documentation_url: string;
}
