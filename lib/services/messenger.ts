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
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as _ from 'lodash';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import {
    Logger,
    LogLevel,
} from '../utils/logger';
import {
    InterimContext, InterimIds,
    MessengerEmitResponse,
    MessengerEvent,
    MessengerWorkerEvent, Metadata,
    ReceiptContext, TransmitContext,
} from './messenger-types';
import {
    ServiceAPIHandle,
    ServiceEmitContext,
    ServiceEmitRequest,
    ServiceEmitter,
    ServiceListener,
    ServiceRegistration,
} from './service-types';

export abstract class Messenger extends WorkerClient<string|null> implements ServiceListener, ServiceEmitter {
    /**
     * Make a handle context, using a receipt context and some extra information.
     * @param event  Event to be converted.
     * @param to     Destination for the handle context.
     * @param toIds  Pre-populate the toIds, if desired.
     * @returns      newly created context for handling a message.
     */
    public static initInterimContext(event: ReceiptContext, to: string, toIds: InterimIds = {}): InterimContext {
        return {
            // Details from the ReceiptContext
            action: event.action,
            first: event.first,
            genesis: event.genesis,
            hidden: event.hidden,
            source: event.source,
            sourceIds: event.sourceIds,
            text: event.text,
            title: event.title,
            // Details from the arguments
            to,
            toIds,
        };
    }

    /**
     * A place to put output for debug and reference.
     * @type {Logger}.
     */
    protected static logger = new Logger();

    /**
     * Retrieve from the environment array of strings to use as indicators of visibility
     * @returns  Object of arrays of indicators, shown and hidden.
     */
    protected static getIndicatorArrays(): { 'shown': string[], 'hidden': string[] } {
        let shown;
        let hidden;
        try {
            // Retrieve publicity indicators from the environment
            shown = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS);
            hidden = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS);
        } catch (error) {
            throw new Error('Message convertor environment variables not set correctly');
        }
        if (shown.length === 0 || hidden.length === 0) {
            throw new Error('Message convertor environment variables not set correctly');
        }
        return { hidden, shown };
    }

    /**
     * Encode the metadata of an event into a string to embed in the message.
     * @param data    event to gather details from.
     * @param format  Optional, markdown or plaintext, defaults to markdown.
     * @returns       Text with data embedded.
     */
    protected static stringifyMetadata(data: TransmitContext, format: 'markdown'|'plaintext' = 'markdown'): string {
        const indicators = Messenger.getIndicatorArrays();
        // Build the content with the indicator and genesis at the front
        switch (format) {
            case 'markdown':
                return `[${data.hidden ? indicators.hidden[0] : indicators.shown[0]}](${data.source})`;
            case 'plaintext':
                return `${data.hidden ? indicators.hidden[0] : indicators.shown[0]}${data.source}`;
            default:
                throw new Error(`${format} format not recognised`);
        }
    }

    /**
     * Given a basic string this will extract a more rich context for the event, if embedded.
     * @param message  basic string that may contain metadata.
     * @returns        object of content, genesis and hidden.
     */
    protected static extractMetadata(message: string): Metadata {
        const indicators = Messenger.getIndicatorArrays();
        const visible = indicators.shown.join('|\\');
        const hidden = indicators.hidden.join('|\\');
        // Anchored with new line; followed by whitespace.
        // Captured, the show/hide; brackets to enclose.
        // Then comes genesis; parens may surround.
        // The case we ignore; a Regex we form!
        const findMetadata = new RegExp(`(?:^|\\r|\\n)(?:\\s*)\\[?(${hidden}|${visible})\\]?\\(?(\\w*)\\)?`, 'i');
        const metadata = message.match(findMetadata);
        if (metadata) {
            // The content without the metadata, the word after the emoji, and whether the emoji is in the visible set
            return {
                content: message.replace(findMetadata, '').trim(),
                genesis: metadata[2] || null,
                hidden: !_.includes(indicators.shown, metadata[1]),
            };
        }
        // Return some default values if there wasn't any metadata
        return {
            content: message,
            genesis: null,
            hidden: true,
        };
    }

    /**
     * A singleton express instance for all web-hook based message services to share.
     * @type {Express}.
     */
    private static _app: express.Express;

    /**
     * Promise to find the comment history of a particular thread.
     * @param thread  id of the thread to search.
     * @param room    id of the room in which the thread resides.
     * @param filter  criteria to match.
     * @param search  Optional, some words which may be used to shortlist the results.
     */
    public abstract fetchNotes: (thread: string, room: string, filter: RegExp, search?: string) => Promise<string[]>;

    /**
     * Promise to turn the data enqueued into a generic message format.
     * @param data  Raw data from the enqueue, remembering this is as dumb and quick as possible.
     * @returns     A promise that resolves to the generic form of the event.
     */
    public abstract makeGeneric: (data: MessengerEvent) => Promise<ReceiptContext>;

    /**
     * Promise to turn a generic message format into a form suitable for emitting.
     * @param data  Generic message format to encode.
     * @returns     A promise that resolves to an emit context, which is as dumb as possible.
     */
    public abstract makeSpecific: (data: TransmitContext) => Promise<ServiceEmitContext>;

    /**
     * Awaken this class as a listener.
     */
    protected abstract activateMessageListener: () => void;

    /**
     * Deliver the payload to the service. Sourcing the relevant context has already been performed.
     * @param data  The object to be delivered to the service.
     * @returns     Response from the service endpoint.
     */
    protected abstract sendPayload: (data: ServiceEmitContext) => Promise<MessengerEmitResponse>;

    /**
     * A boolean flag for if this object has been activated as a listener.
     * @type {boolean}.
     */
    private listening: boolean = false;
    /**
     * An object of arrays storing events by trigger and their actions.
     */
    private _eventListeners: { [event: string]: ServiceRegistration[] } = {};

    /**
     * Create or retrieve the singleton express app.
     * @returns  Singleton express server app.
     */
    protected static get app(): express.Express {
        if (!Messenger._app) {
            // Either MESSAGE_SERVICE_PORT from environment or PORT from Heroku environment
            const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
            if (!port) {
                throw new Error('No inbound port specified for express server');
            }
            // Create and log an express instance
            Messenger._app = express();
            Messenger._app.use(bodyParser.json());
            Messenger._app.listen(port);
            Messenger.logger.log(LogLevel.INFO, `---> Started MessageService shared web server on port '${port}'`);
        }
        return Messenger._app;
    }

    /**
     * Build this service, specifying whether to awaken as a listener.
     * @param listener  whether to start listening during construction.
     */
    constructor(listener: boolean) {
        super();
        if (listener) {
            // Allow the sub-constructor to set up sessions, etc, before listening
            process.nextTick(this.listen);
        }
    }

    /**
     * Start the object listening if it isn't already.
     */
    public listen = () => {
        // Ensure the code in the child object gets executed a maximum of once
        if (!this.listening) {
            this.listening = true;
            this.activateMessageListener();
            Messenger.logger.log(LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
        }
    }

    /**
     * Store an event of interest, so that the method gets triggered appropriately.
     * @param registration  Registration object with event trigger and other details.
     */
    public registerEvent(registration: ServiceRegistration): void {
        // Store each event registration in an object of arrays.
        for (const event of registration.events) {
            if (this._eventListeners[event] == null) {
                this._eventListeners[event] = [];
            }
            this._eventListeners[event].push(registration);
        }
    }

    /**
     * Emit data to the service.
     * @param data  Service Emit Request to send, if relevant.
     * @returns     Details of the successful transmission from the service.
     */
    public sendData(data: ServiceEmitRequest): Promise<MessengerEmitResponse> {
        // Check that the data has specifies a task for our emitter, before passing it on
        if (data.contexts[this.serviceName]) {
            return this.sendPayload(data.contexts[this.serviceName]);
        }
        // If this data has no task for us then no-op is the correct resolution
        return Promise.resolve({
            err: new Error(`No ${this.serviceName} context`),
            source: this.serviceName,
        });
    }

     /**
     * Queue an event ready for running in a child.
     * @param data  The WorkerEvent to add to the queue for processing.
     */
    public queueEvent(data: MessengerWorkerEvent) {
        // This type guards a simple pass-through
        super.queueEvent(data);
    }

    /**
     * Turns the generic, messenger, name for an event into a specific trigger name for this class.
     * @param eventType  Name of the event to translate, eg 'message'.
     * @returns          This class's equivalent, eg 'post'.
     */
    public abstract translateEventName(eventType: string): string;

    /**
     * Pass an event to registered listenerMethods.
     * @param event  enqueued event from the listener.
     * @returns      Promise that resolves once the event is handled.
     */
    protected handleEvent = (event: MessengerEvent): Promise<void> => {
        // Retrieve and execute all the listener methods, squashing their responses
        const listeners = this._eventListeners[event.cookedEvent.type] || [];
        return Promise.map(listeners, (listener) => {
            return listener.listenerMethod(listener, event);
        }).return();
    }

    /**
     * Get a Worker object for the provided event, threaded by context.
     * @param event  event as enqueued by the listener.
     * @returns      worker for the context associated.
     */
    protected getWorker = (event: MessengerWorkerEvent): Worker<string|null> => {
        // Attempt to retrieve an active worker for the context
        const context = event.data.cookedEvent.context;
        const retrieved = this.workers.get(context);
        if (retrieved) {
            return retrieved;
        }
        // Create and store a worker for the context
        const created = new Worker<string>(context, this.removeWorker);
        this.workers.set(context, created);
        return created;
    }

    /**
     * Get the service name, as required by the framework.
     * @return  Name of the service.
     */
    abstract get serviceName(): string

    /**
     * Retrieve the SDK API instance handle for the service, should one exist.
     * @return  Service SDK API handle or void.
     */
    abstract get apiHandle(): ServiceAPIHandle | void;
}
