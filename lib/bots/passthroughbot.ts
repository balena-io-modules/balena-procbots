import * as Promise from 'bluebird';
import * as GithubApi from 'github';
import { Comment, IssueLabel } from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { GithubError } from '../services/github';
import { GithubHandle, GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';
import { LogLevel } from '../utils/logger';

// Need to fill this out with resin component labels and repos
const labelToRepoMap = [
    {
        label: 'component/resinos',
        owner: 'shaunmulligan',
        repo: 'test-component1'
    },
    {
        label: 'component/dashboard',
        owner: 'shaunmulligan',
        repo: 'test-component2'
    }
];

export class PassThroughBot extends ProcBot {
    // Listener and emitter handles
    private githubListenerName: string;
    private githubEmitterName: string;
    private githubApi: GithubApi;

    constructor(integration: number, name: string, pemString: string, webhook: string) {
        // This is the PassThroughBot.
        super(name);

        // Create a new listener for Github with the right Integration ID.
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/passthroughs',
            port: 1234,
            type: 'listener',
            webhookSecret: webhook
        });

        // Create a new emitter with the right Integration ID.
        const ghEmitter = this.addServiceEmitter('github', {
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            pem: pemString,
            type: 'emitter'
        });

        if (!ghListener || !ghEmitter) {
            throw new Error('Could not get all services');
        }

        this.githubListenerName = ghListener.serviceName;
        this.githubEmitterName = ghEmitter.serviceName;

        // Github API handle
        this.githubApi = (<GithubHandle>ghEmitter.apiHandle).github;

        // Register our intent.
        ghListener.registerEvent({
                events: [ 'issues' ],
                listenerMethod: this.passThroughLabelHandler,
                name: 'passThroughLabelEvent',
                triggerLabels: [ 'passthrough' ],
        });
    }

    protected passThroughLabelHandler = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        const issueEvent = event.cookedEvent.data;
        const owner = issueEvent.repository.owner.login;
        const repo = issueEvent.repository.name;
        const issueNumber = issueEvent.issue.number;
        const labelledBy = issueEvent.sender.login;
        const currentIssueTitle = issueEvent.issue.title;
        const currentIssueBody = issueEvent.issue.body;
        const issueAction = issueEvent.action;
        
        // Only act if we get a 'labeled' action.
        if (issueAction === 'labeled') {
            this.logger.log(LogLevel.INFO,'passthrough label added on #' + issueNumber + ' by ' + labelledBy);
            this.logger.log(LogLevel.DEBUG, JSON.stringify(issueEvent));

            // Mirror an issue onto a component repo if it has 1 component label and
            // a passthrough label.
            return this.dispatchToEmitter(this.githubEmitterName, {
                data: {
                    number: issueNumber,
                    owner,
                    repo,
                },
                method: this.githubApi.issues.getIssueLabels
            }).filter(function(label) {
                return label.name.match(/component\/[^/]*/);
            }).then((labels: IssueLabel[]) => {
                let commentBody;
                if (labels.length < 1) {
                    this.logger.log(LogLevel.INFO,'No component label defined');
                    commentBody = `@${labelledBy}: Please add a component label for this passthrough issue`;
                    return {body: commentBody};
                } else if (labels.length === 1) {
                    this.logger.log(LogLevel.DEBUG, JSON.stringify(labels));
                    let component = labelToRepoMap.filter(function( obj ) {
                        return obj.label === labels[0].name;
                    });
                    
                    return this.dispatchToEmitter(this.githubEmitterName, {
                        data: {
                            owner,
                            repo,
                            number: issueNumber,
                        },
                        method: this.githubApi.issues.getComments
                    }).then((comments: Comment[]) => {
                        const comment = comments[comments.length - 1];
                        if ((comments.length > 0) && (comment.user.type === 'Bot') &&
                            comment.body.match(/Created a mirror issue at /i)) {
                            return {body: 'A mirror issue for that component already exists'};
                        } else {

                            // Create an issue on the component
                            return this.dispatchToEmitter(this.githubEmitterName, {
                                    data: {
                                        owner: component[0].owner,
                                        repo: component[0].repo,
                                        title: currentIssueTitle,
                                        body: currentIssueBody,
                                    },
                                    method: this.githubApi.issues.create
                                }).then((issue) => {
                                    this.logger.log(LogLevel.DEBUG, JSON.stringify(issue));
                                    this.logger.log(LogLevel.INFO, `@${labelledBy}: Created a mirror issue on `+ component[0].repo);
                                    return {body: `@${labelledBy}: Created a mirror issue at `+ issue.html_url};
                                }).catch((err) => {
                                    this.logger.log(LogLevel.WARN, 'Error creating issue on component repo:'+err);
                                    throw err;
                                });
                        }

                    }).catch((err) => {
                        this.logger.log(LogLevel.WARN, 'Error creating issue on component repo:'+err);
                        throw err;
                    });
                } else {
                    this.logger.log(LogLevel.INFO, 'there is more than one component repo specified!');
                    commentBody = `@${labelledBy}: there is more than one component label specified!`;
                    return {body: commentBody};
                }
            // Let the user know what has happend by commenting back on the issue
            }).then((comment) => {
                return this.dispatchToEmitter(this.githubEmitterName, {
                    data: {
                        body: comment.body,
                        number: issueNumber,
                        owner,
                        repo,
                    },
                    method: this.githubApi.issues.createComment
                });
            }).catch((err: GithubError) => {
                if (err.message !== 'Not Found') {
                    throw err;
                }
            });
        } else {
            // Don't do anything if the event is not a 'labeled' action.
            return ;
        }
    }
}

// Create the PassThroughBot.
export function createBot(): PassThroughBot {
    if (!(process.env.PASSTHROUGHBOT_NAME && process.env.PASSTHROUGHBOT_INTEGRATION_ID &&
    process.env.PASSTHROUGHBOT_PEM && process.env.PASSTHROUGHBOT_WEBHOOK_SECRET)) {
        throw new Error('Not all relevant evnvars set');
    }

    return new PassThroughBot(process.env.PASSTHROUGHBOT_INTEGRATION_ID, process.env.PASSTHROUGHBOT_NAME,
    process.env.PASSTHROUGHBOT_PEM, process.env.PASSTHROUGHBOT_WEBHOOK_SECRET);
}
