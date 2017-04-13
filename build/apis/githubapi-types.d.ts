/*
Copyright 2016-2017 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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

export interface PushEventCommit {
    sha: string;
    message: string;
    added: string[];
    removed: string[];
    modified: string[];
    timestamp: string;
}

export interface PushEvent {
    type: 'push';
    action: string;
    before: string;
    after: string;
    commits: PushEventCommit[];
    head_commit: PushEventCommit;
    repository: {
        name: string;
        full_name: string;
        owner: {
            name: string;
        }
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

export interface FileContent {
    type: string;
    encoding: string;
    size: number;
    name: string;
    path: string;
    content: string;
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
    body: string;
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
    state: string;
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

export interface Issue {
    body: string;
    comments: number;
    state: string;
    title: string;
}

export interface IssueComment {
    body: string;
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
