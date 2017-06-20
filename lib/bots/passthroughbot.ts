import * as Promise from 'bluebird';
import * as GithubApi from 'github';
import { Comment, IssueCommentEvent } from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { GithubEmitRequestContext, GithubHandle, GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';

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
        console.log('a new passthrough label was added on issue #' + issueNumber);
        return {};
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
