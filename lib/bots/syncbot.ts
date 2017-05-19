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
import { ProcBot } from '../framework/procbot';
import { Messenger } from '../services/messenger';
import {
    DataHub,
    FlowDefinition,
    InterimContext, MessengerAction,
    MessengerContext,
    TransmitContext,
} from '../services/messenger-types';
import {
    ServiceEvent,
    ServiceListenerMethod,
    ServiceRegistration,
} from '../services/service-types';
import { LogLevel } from '../utils/logger';

export class SyncBot extends ProcBot {
    // These objects store built objects, typed and indexed, to help minimise object rebuilding
    private messengers = new Map<string, Messenger>();
    private hub: DataHub;

    /**
     * Creates a SyncBot using SYNCBOT_MAPPINGS and SYNCBOT_HUB_SERVICE from the environment.
     * @param name  identifier for this bot, defaults to SyncBot.
     */
    constructor(name = 'SyncBot') {
        super(name);
        // Register each edge in the mappings array bidirectionally
        const mappings: FlowDefinition[][] = JSON.parse(process.env.SYNCBOT_MAPPINGS);
        for(const mapping of mappings) {
            let priorFlow = null;
            for(const focusFlow of mapping) {
                if(priorFlow) {
                    this.register(priorFlow, focusFlow);
                    this.register(focusFlow, priorFlow);
                }
                priorFlow = focusFlow;
            }
        }
    }

    /**
     * Awaken services and register the event processors.
     * @param from  Definition of a flow to listen to.
     * @param to    Definition of a flow to emit to.
     */
    private register(from: FlowDefinition, to: FlowDefinition) {
        try {
            // Ensure that the adapters are running
            const fromConstructor = JSON.parse(process.env[`SYNCBOT_${from.service.toUpperCase()}_CONSTRUCTOR_OBJECT`]);
            const toConstructor = JSON.parse(process.env[`SYNCBOT_${to.service.toUpperCase()}_CONSTRUCTOR_OBJECT`]);
            this.addServiceListener(from.service, fromConstructor);
            this.addServiceEmitter(from.service, fromConstructor);
            const listener = this.getListener(from.service);
            this.addServiceEmitter(to.service, toConstructor);
            if (listener) {
                // Listen to and handle events
                listener.registerEvent({
                    events: [this.getMessageService(from.service, fromConstructor).translateEventName('message')],
                    listenerMethod: this.createRouter(from, to),
                    name: `${from.service}:${from.flow}=>${to.service}:${to.flow}`,
                });
            }
        } catch (error) {
            this.logger.log(
                LogLevel.WARN,
                `Problem creating link from ${from.service} to ${to.service}: ${error.message}`,
            );
        }
    }

    /**
     * Create a function that will route a data payload to the specified room.
     * @param from  Definition of a flow to listen to.
     * @param to    Definition of a flow to emit to.
     * @returns     function that routes the payload.
     */
    private createRouter(from: FlowDefinition, to: FlowDefinition): ServiceListenerMethod {
        // This function returns a function, watch out!
        return (_registration: ServiceRegistration, data: ServiceEvent): Promise<void> => {
            // Convert the raw payload from the listener into a more generic message object
            return this.getMessageService(from.service).makeGeneric(data).then((generic) => {
                // Check that the payload is in a flow we care about and not destined for somewhere it already is
                if (generic.sourceIds.flow === from.flow
                    && _.intersection([generic.source, generic.genesis], ['system', to.service]).length === 0
                ) {
                    // Transmute the receipt object into an intermediary form, providing flow id to initialise
                    const event = Messenger.initInterimContext(generic, to.service, {flow: to.flow});
                    // Attempt to find a connected thread
                    return this.useConnected(event, 'thread')
                    .then(() => {
                        // Attempt to find account details for the user
                        this.useProvided(event, 'user')
                        .then(() => this.useHubOrGeneric(event, 'token'))
                        // Attempt to emit the event, massaging it first into a final form
                        .then(() => this.create(event as TransmitContext))
                        // Emit the status of the synchronise, console and in-app
                        .then(() => this.logSuccess(event as TransmitContext))
                        .catch((error: Error) => this.handleError(error, event));
                    })
                    .catch(() => {
                        // Attempt to find account details for the user
                        this.useProvided(event, 'user')
                        .then(() => this.useHubOrGeneric(event, 'token'))
                        // Attempt to emit the event and record the connection
                        .then(() => this.create(event as TransmitContext))
                        .then(() => this.createConnection(event, 'thread'))
                        // Emit the status of the synchronise, console and in-app
                        .then(() => this.logSuccess(event as TransmitContext))
                        .catch((error: Error) => this.handleError(error, event));
                    });
                }
                // We have performed all appropriate routing, ie none
                return Promise.resolve();
            });
        };
    }

    /**
     * Report an error back to the source of the event.
     * @param error  error to report.
     * @param event  source event that should be reflected into target context.
     */
    private handleError(error: Error, event: InterimContext): void {
        // Put this on the log service
        this.logger.log(LogLevel.WARN, error.message);
        this.logger.log(LogLevel.WARN, JSON.stringify(event));
        // Create a message event to echo with the details
        const fromEvent: InterimContext = {
            action: MessengerAction.Create,
            first: false,
            genesis: 'system',
            hidden: true,
            source: 'system',
            sourceIds: {
                flow: '',
                message: '',
                thread: '',
                user: '',
            },
            // Format the report for slight user-friendliness
            text: `${event.to} reports \`${error.message}\``,
            // Reflect the source as the to
            to: event.source,
            toIds: {
                flow: event.sourceIds.flow,
                thread: event.sourceIds.thread,
            },
        };
        // Find the system account details
        this.useSystem(fromEvent, 'user')
        .then(() => this.useSystem(fromEvent, 'token'))
        // Report the error
        .then(() => this.create(fromEvent as TransmitContext))
        .then(() => this.logSuccess(fromEvent as TransmitContext))
        .catch((err) => this.logError(err, event));
    }

    /**
     * Retrieve or create a service that can understand the generic message format.
     * @param key   Name of the service to seek.
     * @param data  Instantiation data for the service.
     * @returns     Object which implements the generic message abstract.
     */
    private getMessageService(key: string, data?: any): Messenger {
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
     * Retrieve or create a data hub that can retrieve a user's data.
     * @param key   Name of the hub to seek.
     * @param data  Instantiation data for the hub.
     * @returns     Object which implements the data hub abstract.
     */
    private getDataHub(key: string, data?: any): DataHub {
        if (!this.hub) {
            const service = require(`../services/${key}`);
            this.hub = service.createDataHub(data);
        }
        return this.hub;
    }

    /**
     * Connect two threads with comments about each other.
     * @param event  Event with the two threads specified.
     * @param type   What to connect, must be thread.
     * @returns      Resolves when connection is stored.
     */
    private createConnection(event: InterimContext, type: 'thread'): Promise<void> {
        // Find details of the threads to pair
        const sourceId = event.sourceIds.thread;
        const toId = event.toIds.thread;
        if (!sourceId || !toId) {
            return Promise.reject(new Error(`Could not form ${type} connection`));
        }
        // Create a mutual common object for later tweaks
        const genericEvent: InterimContext = {
            action: MessengerAction.Create,
            first: false,
            genesis: 'system',
            hidden: true,
            source: 'system',
            // System message, so not relevant
            sourceIds: {
                flow: '',
                message: '',
                thread: '',
                user: '',
            },
            // These get adjusted before use
            text: 'duff',
            to: 'duff',
            toIds: {},
        };
        // Clone and tweak to form requests for two services
        const toEvent = _.cloneDeep(genericEvent);
        toEvent.text = `[Connects to ${event.source} ${type} ${sourceId}](${event.sourceIds.url})`;
        toEvent.to = event.to;
        toEvent.toIds = event.toIds;
        const fromEvent = _.cloneDeep(genericEvent);
        fromEvent.text = `[Connects to ${event.to} ${type} ${toId}](${event.toIds.url})`;
        fromEvent.to = event.source;
        fromEvent.toIds = event.sourceIds;
        // Dispatch these events, simplifying the resolutions
        return Promise.all([
            this.useSystem(fromEvent, 'user')
            .then(() => this.useSystem(fromEvent, 'token'))
            .then(() => this.create(fromEvent as TransmitContext))
            .then(() => this.logSuccess(fromEvent as TransmitContext))
            ,
            this.useSystem(toEvent, 'user')
            .then(() => this.useSystem(toEvent, 'token'))
            .then(() => this.create(toEvent as TransmitContext))
            .then(() => this.logSuccess(toEvent as TransmitContext))
        ]).reduce(() => { /**/ });
    }

    /**
     * Pass a transmission context to the emitter.
     * @param event  Standardised transmission context to emit.
     * @returns      Promise that will resolve to the id of the created message.
     */
    private create(event: TransmitContext): Promise<string> {
        // Pass the event to the emitter
        return this.getMessageService(event.to).makeSpecific(event).then((specific) => {
            return this.dispatchToEmitter(event.to, {
                contexts: {
                    // Translating the message event into the specific form for the emitter
                    [event.to]: specific
                },
                source: event.source
            })
            .then((retVal) => {
                // Store and return the created id
                event.toIds.message = retVal.response.message;
                event.toIds.thread = retVal.response.thread;
                event.toIds.url = retVal.response.url;
                return retVal.response.message;
            });
        });
    }

    /**
     * Record to the console some details from the event.
     * @param event  Event to record, will only pass on safe information.
     */
    private logSuccess(event: TransmitContext): void {
        const output = {source: event.source, title: event.title, text: event.text, target: event.to};
        this.logger.log(LogLevel.INFO, `Synced: ${JSON.stringify(output)}`);
    }

    /**
     * This should be called when something really goes wrong, and in-app reports fail.
     * @param error  Error to report.
     * @param event  Event that caused the error.
     */
    private logError(error: Error, event: MessengerContext): void {
        // Do what we can to make this event obvious in the logs
        this.logger.log(LogLevel.WARN, 'v!!!v');
        this.logger.log(LogLevel.WARN, error.message);
        this.logger.log(LogLevel.WARN, JSON.stringify(event));
        this.logger.log(LogLevel.WARN, '^!!!^');
    }

    private useHubOrGeneric(event: InterimContext, type: 'token'): Promise<string> {
        return this.useHub(event, type)
        .catch(() => this.useGeneric(event, type))
        .catchThrow(new Error(`Could not find hub or generic ${type} for ${event.to}`));
    }

    /**
     * Use the source to provide the detail requested.
     * @param event  Event to scrutinise and mutate.
     * @param type   property to search for, must be 'user'.
     * @returns      Resolves to the found property.
     */
    private useProvided(event: InterimContext, type: 'user'): Promise<string> {
        return new Promise<string>((resolve) => {
            // Look in the existing object
            if (!event.sourceIds[type]) {
                throw new Error(`Could not find provided ${type} for ${event.to}`);
            }
            event.toIds[type] = event.sourceIds[type];
            resolve(event.toIds[type]);
        });
    }

    private useGeneric(event: InterimContext, type: 'user'|'token'): Promise<string> {
        return new Promise<string>((resolve) => {
            // Try to find the value specified
            const to = event.to;
            const genericAccounts = JSON.parse(process.env.SYNCBOT_GENERIC_AUTHOR_ACCOUNTS);
            if (!genericAccounts[to] || !genericAccounts[to][type]) {
                throw new Error(`Could not find generic ${type} for ${event.to}`);
            }
            event.toIds[type] = genericAccounts[to][type];
            resolve(genericAccounts[to][type]);
        });
    }

    /**
     * Use the environment SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS to provide the detail requested.
     * @param event  Event to scrutinise and mutate.
     * @param type   property to search for, must be 'user' or 'token'.
     * @returns      Resolves to the found property.
     */
    private useSystem(event: InterimContext, type: 'user'|'token'): Promise<string> {
        return new Promise<string>((resolve) => {
            // Try to find the value specified
            const to = event.to;
            const systemAccounts = JSON.parse(process.env.SYNCBOT_SYSTEM_MESSAGE_ACCOUNTS);
            if (!systemAccounts[to] || !systemAccounts[to][type]) {
                throw new Error(`Could not find system ${type} for ${event.to}`);
            }
            event.toIds[type] = systemAccounts[to][type];
            resolve(systemAccounts[to][type]);
        });
    }

    /**
     * Use the thread history to provide the detail requested.
     * @param event  Event to scrutinise and mutate.
     * @param type   property to search for, must be 'thread'.
     * @returns      Resolves to the found property.
     */
    private useConnected(event: InterimContext, type: 'thread'): Promise<string> {
        // Check the pretext; then capture the id text (roughly speaking include base64, exclude html tag)
        const findBase = `Connects to ${event.to} ${type}`;
        const findId = new RegExp(`${findBase} ([\\w\\d-+\\/=]+)`, 'i');
        // Retrieve from the message service search a filtered thread history
        const messageService = this.getMessageService(event.source);
        return messageService.fetchNotes(event.sourceIds.thread, event.sourceIds.flow, findId, findBase)
        .then((result) => {
            // If we found any comments from the messageService, reduce them to the first id
            const ids = result && result.length > 0 && result[0].match(findId);
            if (ids && ids.length > 0) {
                event.toIds.thread = ids[1];
                return ids[1];
            }
            throw new Error(`Could not find connected ${type} for ${event.to}`);
        });
    }

    /**
     * Use the hub service to provide the detail requested.
     * @param event  Event to scrutinise and mutate.
     * @param type   property to search for, must be 'token'.
     * @returns      Resolves to the found property.
     */
    private useHub(event: InterimContext, type: 'token'): Promise<string> {
        let user: string | undefined = undefined;
        if (event.source === process.env.SYNCBOT_HUB_SERVICE) {
            user = event.sourceIds.user;
        } else if (event.to === process.env.SYNCBOT_HUB_SERVICE) {
            user = event.toIds.user;
        }
        if (user) {
            try {
                const hubName = process.env.SYNCBOT_HUB_SERVICE;
                const hubConstructor = JSON.parse(process.env[`SYNCBOT_${hubName.toUpperCase()}_CONSTRUCTOR_OBJECT`]);
                return this.getDataHub(hubName, hubConstructor).fetchValue(user, `${event.to} ${type}`)
                .then((value) => {
                    event.toIds[type] = value;
                    return value;
                })
                .catch(() => {
                    throw new Error(`Could not find hub ${type} for ${event.to}`);
                });
            } catch (error) {
                return Promise.reject(error);
            }
        } else {
            return Promise.reject(new Error(`Could not find hub ${type} for ${event.to}`));
        }
    }
}

export function createBot(): SyncBot {
    return new SyncBot(process.env.SYNCBOT_NAME);
}
