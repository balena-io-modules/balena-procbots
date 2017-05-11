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

import * as Promise from 'bluebird';
import {
    Session
} from 'flowdock';
import * as _ from 'lodash';
import * as path from 'path';
import * as request from 'request-promise';
import {
    FlowdockHandle,
    FlowdockMessage,
    FlowdockMessageEmitContext,
} from '../services/flowdock-types';
import {
    MessageEmitResponse,
    MessageEvent,
    MessageWorkerEvent,
    ReceiptContext,
} from '../utils/message-types';
import {
    MessageService
} from './message-service';
import {
    ServiceEmitter,
    ServiceListener,
} from './service-types';

/**
 * Class for interacting with the Discourse API
 * Is a MessageService, ServiceListener and ServiceEmitter
 */
export class FlowdockService extends MessageService implements ServiceEmitter, ServiceListener {
    private static session = new Session(process.env.FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN);
    private static _serviceName = path.basename(__filename.split('.')[0]);
    private flowIdToFlowName = new Map<string, string>();

    /**
     * Retrieve the comments in a thread that match an optional filter
     * @param event details to identify the event
     * @param filter regex of comments to match
     */
    public fetchThread(event: ReceiptContext, filter: RegExp): Promise<string[]> {
        // Check that the event being asked about orginated with us
        if (event.source !== this.serviceName) {
            return Promise.reject(new Error('Cannot get flowdock thread from non-flowdock event'));
        }
        return new Promise<string[]>((resolve, reject) => {
            // Create an options array that'll shortlist the responses, if possible
            const keywords = filter.source.match(/(\w+)/g);
            const options = keywords === null ? {} : { search: keywords.join(' ') };
            // Query the API via the SDK
            const org = process.env.FLOWDOCK_ORGANIZATION_PARAMETERIZED_NAME;
            const room = event.sourceIds.room;
            const thread = event.sourceIds.thread;
            FlowdockService.session.get(
                `/flows/${org}/${room}/threads/${thread}/messages`,
                options,
                (error?: Error, result?: FlowdockMessage[]) => {
                    // Massage the callback response into promises
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve(_.map(result, (value: FlowdockMessage) => {
                                // Clean the response to just the content
                                return value.content;
                            }).filter((value: string) => {
                                // Filter the response to just matches
                                const match = value.match(filter);
                                return match !== null && match.length > 0;
                            })
                        );
                    // This should never happen, since the callback pattern should have error or response
                    // ...but this respects typing
                    } else {
                        reject(new Error('Something weird happened in the flowdock SDK'));
                    }
                }
            );
        });
    }

    /**
     * Retrieve the private message history with a user
     * @param event details of the event to consider
     * @param filter optional criteria that must be met
     */
    public fetchPrivateMessages(event: ReceiptContext, filter: RegExp): Promise<string[]> {
        // Check that the event being asked about orginated with us
        if (event.source !== this.serviceName) {
            return Promise.reject(new Error('Cannot get flowdock thread from non-flowdock event'));
        }
        return new Promise<string[]>((resolve, reject) => {
            // Create an options array for shortlisting, if possible
            const keywords = filter.source.match(/(\w+)/g);
            const options = keywords === null ? {} : { search: keywords.join(' ') };
            // Query the API via the SDK
            FlowdockService.session.get(
            `/private/${event.sourceIds.user}/messages`, options,
            (error?: Error, result?: FlowdockMessage[]) => {
                // Massage the callback response into promises
                if (error) {
                    reject(error);
                } else if (result) {
                    resolve(_
                        // Clean the response to just the content
                        .map(result, (value: FlowdockMessage) => {
                            return value.content;
                        })
                        // Filter the response to just matches
                        .filter((value: string) => {
                            const match = value.match(filter);
                            return match !== null && match.length > 0;
                        })
                    );
                // This should never happen, since the callback pattern should have error or response
                // ...but this respects typing
                } else {
                    reject(new Error('Something weird happened in the flowdock SDK'));
                }
            });
        });
    }

    /**
     * Activate this object as a listener
     */
    protected activateMessageListener(): void {
        // Get a list of known flows from the session
        FlowdockService.session.flows((error: any, flows: any) => {
            if (error) {
                throw error;
            }
            // Store the names and stream retrieved flows
            const ids = [];
            for (const flow of flows) {
                ids.push(flow.id);
                this.flowIdToFlowName.set(flow.id, flow.parameterized_name);
            }
            const stream = FlowdockService.session.stream(ids);
            // Listen to messages and check they are messages
            stream.on('message', (message: any) => {
                if (message.event === 'message') {
                    // Enqueue new message events
                    this.queueEvent({
                        data: {
                            cookedEvent: {
                                context: message.thread_id,
                                flow: this.flowIdToFlowName.get(message.flow),
                                type: message.event,
                            },
                            rawEvent: message,
                            source: this.serviceName,
                        },
                        workerMethod: this.handleEvent,
                    });
                }
            });
        });
        // Create a keep-alive endpoint
        MessageService.app.get(`/${this.serviceName}/`, (_formData, response) => {
            response.send('ok');
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
     * Emit data to the API
     * @param data emit context
     */
    protected sendMessage(body: FlowdockMessageEmitContext): Promise<MessageEmitResponse> {
        // Extract a couple of details from the environment
        const org = process.env.FLOWDOCK_ORGANIZATION_PARAMETERIZED_NAME;
        const token = new Buffer(process.env.FLOWDOCK_LISTENER_ACCOUNT_API_TOKEN).toString('base64');
        // Post to the API
        const requestOpts = {
            body,
            headers: {
                'Authorization': `Basic ${token}`,
                'X-flowdock-wait-for-message': true,
            },
            json: true,
            url: `https://api.flowdock.com/flows/${org}/${body.flow}/messages/`,
        };
        return request.post(requestOpts).then((resData: any) => {
            // Massage the response into a suitable form for the framework
            return {
                response: {
                    ids: {
                        message: resData.id,
                        thread: resData.thread_id,
                    }
                },
                source: this.serviceName,
            };
        });
    }

    /**
     * get the service name, as required by the framework
     */
    get serviceName(): string {
        return FlowdockService._serviceName;
    }

    // Retrieve the API handle for Flowdock.
    get apiHandle(): FlowdockHandle {
        return {
            flowdock: FlowdockService.session
        };
    }
}

/**
 * Return this class activated and typed as a listener
 */
export function createServiceListener(): ServiceListener {
    return new FlowdockService(true);
}

/**
 * Return this class typed as an emitter
 */
export function createServiceEmitter(): ServiceEmitter {
    return new FlowdockService(false);
}

/**
 * Return this class typed as a messenger
 */
export function createMessageService(): MessageService {
    return new FlowdockService(false);
}
