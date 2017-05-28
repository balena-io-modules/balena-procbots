import * as Promise from 'bluebird';
import * as GithubApi from 'github';
import { Comment, IssueCommentEvent } from '../apis/githubapi-types';
import { ProcBot } from '../framework/procbot';
import { GithubEmitRequestContext, GithubHandle, GithubRegistration } from '../services/github-types';
import { ServiceEvent } from '../services/service-types';

const Fortunes = [
    'Great thoughts come from the heart. Your brain is on strike.',
    'People in your surroundings will be more cooperative than usual. Bring money.',
    'Your life will be filled with magical moments. Also, chocolate.',
    'Use your instincts now. RUN!',
    'The energy is within you. Money is Coming!',
    'Darkness is only succesful when there is no light. Don\'t forget about light!',
    'Encourage your peers. To write ProcBots.',
    'The man on the top of the mountain did not fall there. Though he may be out of bottled oxygen.',
];

export class FortuneBot extends ProcBot {
    // Listener and emitter handles
    private githubListenerName: string;
    private githubEmitterName: string;
    private githubApi: GithubApi;

    constructor(integration: number, name: string, pemString: string, webhook: string) {
        // This is the VersionBot.
        super(name);

        // Create a new listener for Github with the right Integration ID.
        const ghListener = this.addServiceListener('github', {
            client: name,
            loginType: {
                integrationId: integration,
                pem: pemString,
                type: 'integration'
            },
            path: '/fortunes',
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
                events: [ 'issue_comment' ],
                listenerMethod: this.tellFortune,
                name: 'TellUserFortune',
        });
    }

    protected tellFortune = (_registration: GithubRegistration, event: ServiceEvent): Promise<void> => {
        const issueEvent = <IssueCommentEvent>event.cookedEvent.data;
        const owner = issueEvent.repository.owner.login;
        const repo = issueEvent.repository.name;
        const issueNumber = issueEvent.issue.number;

        // Get the comments for the PR. If the last comment asked for a fortune, tell it!
        return this.githubCall({
            data: {
                number: issueNumber,
                owner,
                repo,
            },
            method: this.githubApi.issues.getComments
        }).then((comments: Comment[]) => {
            // Look for the last comment.
            if (comments.length > 0) {
                const comment = comments[comments.length - 1];
                const author = comment.user.login;
                const body = comment.body;
                if (body.match(/fortune me, baby!/i)) {
                    // Pick a fortune.
                    const fortune = Fortunes[Math.floor(Math.random() * Fortunes.length)];
                    const newBody = `@${author}: ${fortune}`;
                    return this.githubCall({
                        data: {
                            body: newBody,
                            number: issueNumber,
                            owner,
                            repo,
                        },
                        method: this.githubApi.issues.createComment
                    });
                }
            }
        });
    }

    // Allows simplified structures to be passed as a Github emitter call.
    // This method fills in the blanks.
    // This will soon be unrequired, as the base class will call into the service
    // directly for data/error transformations.
    private githubCall(context: GithubEmitRequestContext): Promise<any> {
        const request = {
            contexts: {
                github: context
            },
            source: process.env.VERSIONBOT_NAME
        };

        return this.dispatchToEmitter(this.githubEmitterName, request).then((data) => {
            if (data.err) {
                // Specifically throw the error message.
                const ghError = JSON.parse(data.err.message);
                throw new Error(ghError.message);
            }

            return data.response;
        });
    }
}

// Create the FortuneBot.
export function createBot(): FortuneBot {
    if (!(process.env.FORTUNEBOT_NAME && process.env.FORTUNEBOT_INTEGRATION_ID &&
    process.env.FORTUNEBOT_PEM && process.env.FORTUNEBOT_WEBHOOK_SECRET)) {
        throw new Error('Not all relevant evnvars set');
    }

    return new FortuneBot(process.env.FORTUNEBOT_INTEGRATION_ID, process.env.FORTUNEBOT_NAME,
    process.env.FORTUNEBOT_PEM, process.env.FORTUNEBOT_WEBHOOK_SECRET);
}
