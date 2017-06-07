import * as Promise from 'bluebird';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { InterimContext, InterimIds, MessengerEmitResponse, MessengerEvent, MessengerWorkerEvent, Metadata, ReceiptContext, TransmitContext } from './messenger-types';
import { ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
export declare abstract class Messenger extends WorkerClient<string | null> implements ServiceListener, ServiceEmitter {
    static initInterimContext(event: ReceiptContext, to: string, toIds?: InterimIds): InterimContext;
    protected static logger: Logger;
    protected static getIndicatorArrays(): {
        'shown': string[];
        'hidden': string[];
    };
    protected static stringifyMetadata(data: TransmitContext, format?: 'markdown' | 'plaintext'): string;
    protected static extractMetadata(message: string): Metadata;
    private static _app;
    abstract fetchNotes: (thread: string, room: string, filter: RegExp, search?: string) => Promise<string[]>;
    abstract makeGeneric: (data: MessengerEvent) => Promise<ReceiptContext>;
    abstract makeSpecific: (data: TransmitContext) => Promise<ServiceEmitContext>;
    protected abstract activateMessageListener: () => void;
    protected abstract sendPayload: (data: ServiceEmitContext) => Promise<MessengerEmitResponse>;
    private listening;
    private _eventListeners;
    protected static readonly app: express.Express;
    constructor(listener: boolean);
    listen: () => void;
    registerEvent(registration: ServiceRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<MessengerEmitResponse>;
    queueEvent(data: MessengerWorkerEvent): void;
    abstract translateEventName(eventType: string): string;
    protected handleEvent: (event: MessengerEvent) => Promise<void>;
    protected getWorker: (event: MessengerWorkerEvent) => Worker<string | null>;
    readonly abstract serviceName: string;
    readonly abstract apiHandle: ServiceAPIHandle | void;
}
