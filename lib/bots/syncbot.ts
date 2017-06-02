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
import * as _ from 'lodash';
import {
    ProcBot
} from '../framework/procbot';
import {
    MessageService,
} from '../services/message-service';
import {
    ServiceEvent,
    ServiceListenerMethod,
    ServiceRegistration,
} from '../services/service-types';
import {
    LogLevel,
} from '../utils/logger';
import {
    initMessageHandleContext,
    initThreadHandleContext,
    makeGeneric,
    makeSpecific,
    translateTrigger,
} from '../utils/message-converters';
import {
    HandleContext,
    MessageContext,
    MessageHandleContext,
    MessageReceiptContext,
    MessageTransmitContext,
    ReceiptContext,
    ThreadHandleContext,
    ThreadReceiptContext,
    ThreadTransmitContext,
    TransmitContext,
} from '../utils/message-types';

/**
 * This is a ProcBot for the synchronisation of communication between services
 */
export class SyncBot extends ProcBot {
    private messengers = new Map<string, MessageService>();
    private rooms = JSON.parse(process.env.SYNCBOT_ROOMS_TO_SYNCHRONISE);
    private genericAccounts = JSON.parse(process.env.SYNCBOT_GENERIC_AUTHOR_ACCOUNTS);
    private systemAccounts = JSON.parse(process.env.SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS);

    constructor(name = 'SyncBot') {
        super(name);
        for (const event of JSON.parse(process.env.SYNCBOT_EVENTS_TO_SYNCHRONISE)) {
            this.register(event.from, event.to, event.event);
        }
    }

    /**
     * This registers an event of interest, ensuring we have relevant structures running
     * @param from adapter to listen to
     * @param to adapter to emit to
     * @param type event type to register
     */
    private register(from: string, to: string, type: 'message'|'thread') {
        // Ensure that the adapters are running
        this.addServiceListener(from);
        const listener = this.getListener(from);
        this.addServiceEmitter(to);
        if (listener) {
            // Listen to and handle events
            listener.registerEvent({
                events: [translateTrigger(type, from)],
                listenerMethod: this.createRouter(from, to),
                name: `${from}_${to}_${type}`,
            });
        }
    }

    /**
     * Return a function that Promises to route provided events
     * @param from the name of the listener that generates the events
     * @param to the name of the emitter that the events are passed through to
     */
    private createRouter(from: string, to: string): ServiceListenerMethod {
        return (_registration: ServiceRegistration, data: ServiceEvent): Promise<void> => {
            // Convert the raw payload from the listener into a more generic message object
            const generic = makeGeneric(from, data);
            // Prevent loops and system messages
            if (_.intersection([generic.source, generic.genesis], ['system', to]).length === 0) {
                // Pass handling to more specific methods
                if (generic.type === 'thread') {
                    return this.handleThread(initThreadHandleContext(generic as ThreadReceiptContext, to));
                } else if (generic.type === 'message') {
                    return this.handleMessage(initMessageHandleContext(generic as MessageReceiptContext, to));
                }
                // We do not understand how to handle this message type
                return Promise.reject(new Error('Event type not understood'));
            }
            // We have performed all appropriate routing, ie none
            return Promise.resolve();
        };
    }

    /**
     * Handle a new thread event, creating and connecting appropriately
     * @param event details of the thread being synchronised
     */
    private handleThread(event: ThreadHandleContext): Promise<void> {
        // Find details that are required for synchronisation
        return this.searchPairs(event, 'room')
            .then(() => this.searchPrivateExistingOrGeneric(event, 'user'))
            .then(() => this.searchPrivateOrGeneric(event, 'token'))
            // Create thread and connection entities
            .then(() => this.create(event as ThreadTransmitContext, 'thread'))
            .then(() => this.createConnection(event, 'thread'))
            // Log the event
            .then(() => this.logSuccess(event))
            .catch((error: Error) => this.handleError(error, event));
    }

    /**
     * Handle a new message event, creating appropriately
     * @param event details of the message being synchornised
     */
    private handleMessage(event: MessageHandleContext): Promise<void> {
        // Find details that are required for synchronisation
        return this.searchHistory(event, 'thread')
            .then(() => {
                this.searchPairs(event, 'room')
                .then(() => this.searchPrivateExistingOrGeneric(event, 'user'))
                .then(() => this.searchPrivateOrGeneric(event, 'token'))
                // Create the message
                .then(() => this.create(event as MessageTransmitContext, 'message'))
                // Log the event
                .then(() => this.logSuccess(event))
                .catch((error: Error) => this.handleError(error, event));
            })
            // Ignore errors when scrutinising threads without links
            .catch(() => { /* */ });
    }

    /**
     * Report in-app an error with the processing of an event
     * @param error Error object to be reported on
     * @param event Event to be reported on
     */
    private handleError(error: Error, event: HandleContext): void {
        // Create a message event to echo with the details
        const fromEvent: MessageHandleContext = {
            action: 'create',
            genesis: 'system',
            private: true,
            source: 'system',
            sourceIds: {
                message: '',
                room: '',
                thread: '',
                user: '',
            },
            text: error.message,
            to: event.source,
            toIds: {
                room: event.sourceIds.room,
                thread: event.sourceIds.thread,
            },
            type: 'message',
        };
        // Find the system account details
        this.searchSystem(fromEvent, 'user')
        .then(() => this.searchSystem(fromEvent, 'token'))
        // Report the error
        .then(() => this.create(fromEvent as MessageTransmitContext, 'message'))
        .then(() => this.logSuccess(fromEvent))
        .catch((err) => this.logError(event, err.message));
    }

    /**
     * Typeguard and singleton the retrieval of a MessageService
     * @param key name of the service to retrieve
     * @param data instantiation data for the service, if required
     */
    private getMessageService(key: string, data?: any): MessageService {
        // Attempt to retrieve and return the existing messenger
        const retrieved = this.messengers.get(key);
        if (retrieved) {
            return retrieved;
        }
        // Create, stash and return a new messenger
        const service = require(`../services/${key}`);
        const created = service.createMessageService(data);
        this.messengers.set(key, created);
        return created;
    }

    /**
     * Put a whisper on both threads indicating the connection
     * @param event details of the connection to form
     * @param type entities to link, must be thread
     */
    private createConnection(event: HandleContext, type: 'thread'): Promise<void> {
        // Find details of the threads to pair
        const sourceId = event.sourceIds[type];
        const toId = event.toIds[type];
        if (!sourceId || !toId) {
            return Promise.reject(new Error(`Could not form ${type} connection`));
        }
        // Build event for target object to reference source
        const toEvent: MessageHandleContext = {
            action: 'create',
            genesis: 'system',
            private: true,
            source: 'system',
            sourceIds: {
                message: '',
                room: '',
                thread: '',
                user: '',
            },
            text: `Connects to ${event.source} ${type} ${sourceId}`,
            to: event.to,
            toIds: {
                room: event.toIds.room,
                thread: event.toIds.thread,
            },
            type: 'message',
        };
        // Build event for source object to reference target
        const fromEvent: MessageHandleContext = {
            action: 'create',
            genesis: 'system',
            private: true,
            source: 'system',
            sourceIds: {
                message: '',
                room: '',
                thread: '',
                user: '',
            },
            text: `Connects to ${event.to} ${type} ${toId}`,
            to: event.source,
            toIds: {
                room: event.sourceIds.room,
                thread: event.sourceIds.thread,
            },
            type: 'message',
        };
        // Dispatch these events, simplifying the resolutions
        return Promise.all([
            this.searchSystem(fromEvent, 'user')
            .then(() => this.searchSystem(fromEvent, 'token'))
            .then(() => this.create(fromEvent as MessageTransmitContext, 'message'))
            ,
            this.searchSystem(toEvent, 'user')
            .then(() => this.searchSystem(toEvent, 'token'))
            .then(() => this.create(toEvent as MessageTransmitContext, 'message'))
        ]).reduce(() => { /* */ });
    }

    /**
     * Dispatch the creation of an entity to the emitter
     * @param event Details of the event to be handled
     * @param type Type of entity to create
     */
    private create(event: TransmitContext, type: 'message' | 'thread'): Promise<string> {
        // Pass the event to the emitter
        return this.dispatchToEmitter(event.to, {
            contexts: {
                // Translating the message event into the specific form for the emitter
                [event.to]: makeSpecific(event)
            },
            source: event.source
        })
        .then((retVal) => {
            // Store and return the created id
            event.toIds[type] = retVal.response.ids[type];
            return retVal.response.ids[type];
        });
    }

    /**
     * Put the event onto the console
     * @param event event to log
     */
    private logSuccess(event: MessageContext): void {
        this.logger.log(LogLevel.INFO, `synced ${event.source}: ${event.text}`);
    }

    /**
     * Put the event and optional message onto the console, highlighted
     * @param event event to log
     * @param message message, if any, to accompany this
     */
    private logError(event: MessageContext, message?: string): void {
        this.logger.log(LogLevel.WARN, JSON.stringify(event));
        if (message) {
            this.logger.log(LogLevel.WARN, message);
        }
    }

    /**
     * Populate and resolve to the specified search term, from private messages, source details or generic
     * @param event source of existing details
     * @param type entity required
     */
    private searchPrivateExistingOrGeneric(event: HandleContext, type: 'user'): Promise<string> {
        return this.searchPrivate(event, type)
        .catch(() => this.searchExisting(event, type))
        .catch(() => this.searchGeneric(event, type))
        .catchThrow(new Error(`Could not find private, existing or generic ${type} for ${event.to}`));
    }

    /**
     * Populate and resolve to the specified search term, from private messages or generic
     * @param event source of existing details
     * @param type entity required
     */
    private searchPrivateOrGeneric(event: HandleContext, type: 'token' | 'user'): Promise<string> {
        return this.searchPrivate(event, type)
        .catch(() => this.searchGeneric(event, type))
        .catchThrow(new Error(`Could not find private or generic ${type} for ${event.to}`));
    }

    /**
     * Populate and resolve to the specified search term, from configured pairs
     * @param event source of existing details
     * @param type entity required
     */
    private searchPairs(event: HandleContext, type: 'room'): Promise<string> {
        return new Promise<string>((resolve) => {
            // Extract some indexes
            const from = event.source;
            const to = event.to;
            const id = event.sourceIds[type];
            // Try to find the value specified
            if (!this.rooms[from] ||
            !this.rooms[from][id] ||
            !this.rooms[from][id][to]) {
                throw new Error(`Could not find paired ${type} for ${event.to}`);
            }
            // Mutate using and resolve to the found value
            event.toIds[type] = this.rooms[from][id][to];
            resolve(this.rooms[from][id][to]);
        });
    }

    /**
     * Populate and resolve to the specified search term, from the existing
     * @param event source of existing details
     * @param type entity required
     */
    private searchExisting(event: HandleContext, type: 'user'): Promise<string> {
        return new Promise<string>((resolve) => {
            // Look in the existing object
            if (!event.sourceIds[type]) {
                throw new Error(`Could not find existing ${type} for ${event.to}`);
            }
            event.toIds[type] = event.sourceIds[type];
            resolve(event.toIds[type]);
        });
    }

    /**
     * Populate and resolve to the specified search term, from configured generics
     * @param event source of existing details
     * @param type entity required
     */
    private searchGeneric(event: HandleContext, type: 'user' | 'token'): Promise<string> {
        return new Promise<string>((resolve) => {
            // Try to find the value specified
            const to = event.to;
            if (!this.genericAccounts[to] ||
            !this.genericAccounts[to][type]) {
                throw new Error(`Could not find generic ${type} for ${event.to}`);
            }
            event.toIds[type] = this.genericAccounts[to][type];
            resolve(this.genericAccounts[to][type]);
        });
    }

    /**
     * Populate and resolve to the specified search term, from the configured system details
     * @param event source of existing details
     * @param type entity required
     */
    private searchSystem(event: HandleContext, type: 'user' | 'token'): Promise<string> {
        return new Promise<string>((resolve) => {
            // Try to find the value specified
            const to = event.to;
            if (!this.systemAccounts[to] ||
            !this.systemAccounts[to][type]) {
                throw new Error(`Could not find system ${type} for ${event.to}`);
            }
            event.toIds[type] = this.systemAccounts[to][type];
            resolve(this.systemAccounts[to][type]);
        });
    }

    /**
     * Populate and resolve to the specified search term, from the event history
     * @param event source of existing details
     * @param type entity required
     * @param attemptLeft how many more times to seek the information
     */
    private searchHistory(event: HandleContext, type: 'thread', attemptsLeft: number = 3): Promise<string> {
        // Check the pretext; then capture the id text (roughly speaking include base64, exclude html tag)
        const findId = new RegExp(`Connects to ${event.to} ${type} ([\\w\\d-+\\/=]+)`, 'i');
        // Retrieve from the message service search a filtered thread history
        const messageService = this.getMessageService(event.source);
        return messageService.fetchThread(event as ReceiptContext, findId)
        .then((result) => {
            // If we found any comments from the messageService, reduce them to the first id
            const ids = result && result.length > 0 && result[0].match(findId);
            if (ids && ids.length > 0) {
                event.toIds[type] = ids[1];
                return ids[1];
            // Give it more attempts or reject
            } else if (attemptsLeft > 0) {
                return this.searchHistory(event, type, attemptsLeft-1);
            }
            throw new Error(`Could not find history ${type} for ${event.to}`);
        });
    }

    /**
     * Populate are resolve to the specified search term, from the private message history
     * @param event source of existing details
     * @param type entity required
     */
    private searchPrivate(event: HandleContext, type: 'token' | 'user'): Promise<string> {
        // Check the pretext; then capture the id text (roughly speaking include base64, exclude html tag)
        const findValue = new RegExp(`My ${event.to} ${type} is ([\\w\\d-+\\/=]+)`, 'i');
        // Retrieve from the message service a filtered private message history
        const messageService = this.getMessageService(event.source);
        return messageService.fetchPrivateMessages(event as ReceiptContext, findValue)
        .then((result) => {
            // If we found any comments from the messageService, reduce them to the first id
            const ids = result && result.length > 0 && result[result.length-1].match(findValue);
            if (ids && ids.length > 1) {
                event.toIds[type] = ids[1];
                return ids[1];
            }
            throw new Error(`Could not find private message ${type} for ${event.to}`);
        });
    }
}

export function createBot(): SyncBot {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
