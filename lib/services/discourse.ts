import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as request from 'request-promise';
import {
    MessageEmitResponse,
    MessageEvent,
    MessageWorkerEvent,
    ReceiptContext,
} from '../utils/message-types';
import {
    DiscourseMessageEmitContext,
    DiscoursePost,
} from './discourse-types';
import {
    MessageService,
} from './message-service';
import {
    ServiceEmitter,
    ServiceListener,
} from './service-types';

/**
 * Class for interacting with the discourse API
 * Is a MessageService, ServiceListener and ServiceEmitter
 */
export class DiscourseService extends MessageService implements ServiceListener, ServiceEmitter {
    private static _serviceName = path.basename(__filename.split('.')[0]);
    private topicCache = new Map<string, any>();
    private postsSynced = new Set<number>();

    /**
     * Retrieve the comments in a thread that match an optional filter
     * @param event details to identify the event
     * @param filter regex of comments to match
     */
    public fetchThread(event: ReceiptContext, filter: RegExp): Promise<string[]> {
        // Check that the event being asked about orginated with us
        if (event.source !== this.serviceName) {
            return Promise.reject(new Error('Cannot get discourse thread from non-discourse event'));
        }
        // Query the API
        const getThread = {
            json: true,
            method: 'GET',
            qs: {
                api_key: process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN,
                api_username: process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME,
            },
            uri: `https://${process.env.DISCOURSE_INSTANCE_URL}/t/${event.sourceIds.thread}`,
        };
        return request(getThread).then((thread) => {
            return _.map(thread.post_stream.posts, (item: DiscoursePost) => {
                // Clean the response down to only the text
                return item.cooked;
            }).filter((value: string) => {
                // Filter the response down to only matches
                const match = value.match(filter);
                return match !== null && match.length > 0;
            });
        });
    }

    /**
     * Activate this object as a listener
     */
    protected activateMessageListener(): void {
        // Create an endpoint for this listener
        MessageService.app.post(`/${this.serviceName}/`, (formData, response) => {
            if(this.postsSynced.has(formData.body.post.id)) {
                response.send();
            } else {
                this.postsSynced.add(formData.body.post.id);
                this.fetchTopic(formData.body.post.topic_id)
                .then((topic: any) => {
                    if (formData.body.post.post_number === 1) {
                        // Enqueue a new topic event if this is the 1st post
                        const topicEvent = {
                            data: {
                                cookedEvent: {
                                    context: topic.id,
                                    type: 'topic',
                                },
                                rawEvent: topic,
                                source: this.serviceName,
                            },
                            workerMethod: this.handleEvent,
                        };
                        this.queueEvent(topicEvent);
                    }
                    // Retrieve the un-abridged version of the post
                    const getPost = {
                        json: true,
                        method: 'GET',
                        qs: {
                            api_key: process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN,
                            api_username: process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME,
                        },
                        uri: `https://${process.env.DISCOURSE_INSTANCE_URL}/posts/${formData.body.post.id}`,
                    };
                    request(getPost)
                    .then((post) => {
                        // Enqueue a new post event
                        const postEvent = {
                            data: {
                                cookedEvent: {
                                    category: topic.category_id,
                                    context: topic.id,
                                    type: formData.headers['x-discourse-event-type'],
                                },
                                rawEvent: post,
                                source: this.serviceName,
                            },
                            workerMethod: this.handleEvent,
                        };
                        this.queueEvent(postEvent);
                    });
                });
                response.send();
            }
        });
    }

    /**
     * Emit data to the API
     * @param data emit context
     */
    protected sendMessage(data: DiscourseMessageEmitContext): Promise<MessageEmitResponse> {
        // Extract a couple of details from out of the context
        const token = data.api_token;
        const username = data.api_username;
        const body = _.clone(data);
        delete body.api_token;
        delete body.api_username;
        // POST the post to the API
        const postPost = {
            body,
            json: true,
            url: `https://${process.env.DISCOURSE_INSTANCE_URL}/posts?api_key=${token}&api_username=${username}`
        };
        return request.post(postPost).then((resData) => {
            // Translate the response from the API back into the framework
            return {
                response: {
                    ids: {
                        message: resData.id,
                        thread: resData.topic_id,
                    }
                },
                source: this.serviceName,
            };
        });
    }

    /**
     * Retrieve the scope for event order preservation
     * @param event details to examine
     */
    protected getWorkerContextFromMessage(event: MessageWorkerEvent): string {
        return event.data.cookedEvent.context;
    }

    /**
     * Retrieve the event type for event firing
     * @param event details to examine
     */
    protected getEventTypeFromMessage(event: MessageEvent): string {
        return event.cookedEvent.type;
    }

    /**
     * Retrieve the full topic object from an id
     * @param topicId id of the topic to fetch
     */
    private fetchTopic(topicId: string): Promise<any> {
        // Attempt to find this in the cache
        if (this.topicCache.has(topicId)) {
            return Promise.resolve(this.topicCache.get(topicId));
        } else {
            // Build an API request
            const token = process.env.DISCOURSE_LISTENER_ACCOUNT_API_TOKEN;
            const username = process.env.DISCOURSE_LISTENER_ACCOUNT_USERNAME;
            const rootUrl = process.env.DISCOURSE_INSTANCE_URL;
            const requestOpts = {
                json: true,
                url: `https://${rootUrl}/t/${topicId}?api_key=${token}&api_username=${username}`
            };
            // Request, cache and return
            return request.get(requestOpts).then((resData) => {
                this.topicCache.set(topicId, resData);
                return resData;
            });
        }
    }

    /**
     * get the service name, as required by the framework
     */
    get serviceName(): string {
        return DiscourseService._serviceName;
    }

    // There is no API handle for discourse.
    get apiHandle(): void {
        return;
    }
}

/**
 * Return this class activated and typed as a listener
 */
export function createServiceListener(): ServiceListener {
    return new DiscourseService(true);
}

/**
 * Return this class typed as an emitter
 */
export function createServiceEmitter(): ServiceEmitter {
    return new DiscourseService(false);
}

/**
 * Return this class typed as a messenger
 */
export function createMessageService(): MessageService {
    return new DiscourseService(false);
}
