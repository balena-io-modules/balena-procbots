import * as Promise from 'bluebird';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { InterimContext, MessengerEmitResponse, MessengerEvent, MessengerIds, MessengerWorkerEvent, Metadata, PublicityIndicator, ReceiptContext, TransmitContext } from './messenger-types';
import { ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
export declare abstract class Messenger extends WorkerClient<string | null> implements ServiceListener, ServiceEmitter {
    static initInterimContext(event: ReceiptContext, to: string, toIds?: MessengerIds): InterimContext;
    protected static logger: Logger;
    protected static getIndicatorArrays(): {
        'shown': PublicityIndicator;
        'hidden': PublicityIndicator;
    };
    protected static stringifyMetadata(data: TransmitContext, format: string): string;
    protected static extractMetadata(message: string, format: string): Metadata;
    protected static messageOfTheDay(): string;
    private static _expressApp;
    private static metadataByRegex(message, regex);
    protected static readonly expressApp: express.Express;
    abstract fetchNotes: (thread: string, room: string, filter: RegExp, search?: string) => Promise<string[]>;
    abstract makeGeneric: (data: MessengerEvent) => Promise<ReceiptContext>;
    abstract makeSpecific: (data: TransmitContext) => Promise<ServiceEmitContext>;
    protected abstract activateMessageListener: () => void;
    protected abstract sendPayload: (data: ServiceEmitContext) => Promise<MessengerEmitResponse>;
    private listening;
    private _eventListeners;
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
