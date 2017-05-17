import * as Promise from 'bluebird';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import {
    Logger,
    LogLevel,
} from '../utils/logger';
import {
    MessageEmitResponse,
    MessageEvent,
    MessageWorkerEvent,
    ReceiptContext,
} from '../utils/message-types';
import {
    ServiceAPIHandle,
    ServiceEmitContext,
    ServiceEmitRequest,
    ServiceEmitter,
    ServiceListener,
    ServiceRegistration,
} from './service-types';

/**
 * Abstract class to define a common set of utilities and standards for all messenger classes
 */
export abstract class MessageService extends WorkerClient<string|null> implements ServiceListener, ServiceEmitter {
    protected static logger = new Logger();
    private static _app: express.Express;
    private listening: boolean = false;
    private _eventListeners: { [event: string]: ServiceRegistration[] } = {};

    /**
     * All messenger classes share a single express instance
     */
    protected static get app(): express.Express {
        // Heroku uses process.env.PORT to indicate which local area port the edge NAT maps down to
        const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
        if (!port) {
            throw new Error('No inbound port specified for express server');
        }
        if (!MessageService._app) {
            MessageService._app = express();
            MessageService._app.use(bodyParser.json());
            MessageService._app.listen(port);
        }
        return MessageService._app;
    }

    /**
     * @param listener selector for whether this instance should listen
     */
    constructor(listener: boolean) {
        super();
        if (listener) {
            this.listen();
        }
    }

    /**
     * Instruct the child to start listening if we haven't already
     */
    public listen() {
        if (!this.listening) {
            this.listening = true;
            this.activateMessageListener();
            MessageService.logger.log(LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
        }
    }

    /**
     * Express an interest in a particular type of event
     * @param registration Object detailing event type, callback, etc
     */
    public registerEvent(registration: ServiceRegistration): void {
        // For each event type being registered
        for (const event of registration.events) {
            // Ensure we have a listener array for it
            if (this._eventListeners[event] == null) {
                this._eventListeners[event] = [];
            }
            // Store the expression of interest
            this._eventListeners[event].push(registration);
        }
    }

    /**
     * Emit data to the external service
     * @param data ServiceEmitRequest to parse
     */
    public sendData(data: ServiceEmitRequest): Promise<MessageEmitResponse> {
        // Check the contexts for relevance before passing down the inheritance
        if (data.contexts[this.serviceName]) {
            return this.sendMessage(data.contexts[this.serviceName]);
        } else {
            // If we have a context to emit to this service, then no-op is correct resolution
            return Promise.resolve({
                err: new Error(`No ${this.serviceName} context`),
                source: this.serviceName,
            });
        }
    }

    /**
     * Enqueue a MessageWorkerEvent
     * @param data event to enqueue
     */
    public queueEvent(data: MessageWorkerEvent) {
        // This simply passes it up the chain...
        // but ensures that MessageServices only enqueue the correct type
        super.queueEvent(data);
    }

    // TODO: event should be in the same format as emitted
    /**
     * Retrieve the comments in a thread that match an optional filter
     * @param event details to identify the event
     * @param filter regex of comments to match
     */
    public fetchThread(_event: ReceiptContext, _filter: RegExp): Promise<string[]> {
        return Promise.reject(new Error('Not yet implemented'));
    }

    // TODO: event should be in the same format as emitted
    /**
     * Retrieve the private message history with a user
     * @param event details of the event to consider
     * @param filter optional criteria that must be met
     */
    public fetchPrivateMessages(_event: ReceiptContext, _filter: RegExp): Promise<string[]> {
        return Promise.reject(new Error('Not yet implemented'));
    }

    /**
     * Activate this object as a listener
     */
    protected abstract activateMessageListener(): void;

    /**
     * Emit data to the API
     * @param data emit context
     */
    protected abstract sendMessage(data: ServiceEmitContext): Promise<MessageEmitResponse>

    /**
     * Retrieve the scope for event order preservation
     * @param event details to examine
     */
    protected abstract getWorkerContextFromMessage(event: MessageWorkerEvent): string

    /**
     * Retrieve the event type for event firing
     * @param event details to examine
     */
    protected abstract getEventTypeFromMessage(event: MessageEvent): string

    /**
     * Handle an event once it's turn in the queue comes round
     * Bound to the object instance using =>
     */
    protected handleEvent = (event: MessageEvent): Promise<void> => {
        // Retrieve and execute all the listener methods, nerfing their responses
        const listeners = this._eventListeners[event.cookedEvent.type] || [];
        return Promise.map(listeners, (listener) => {
            return listener.listenerMethod(listener, event);
        }).return();
    }

    /**
     * Retrieve or create a worker for an event
     */
    protected getWorker = (event: MessageWorkerEvent): Worker<string|null> => {
        // Attempt to retrieve an active worker for the context
        const context = this.getWorkerContextFromMessage(event);
        const retrieved = this.workers.get(context);
        if (retrieved) {
            return retrieved;
        // Create and store a worker for the context
        } else {
            const created = new Worker<string>(context, this.removeWorker);
            this.workers.set(context, created);
            return created;
        }
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
