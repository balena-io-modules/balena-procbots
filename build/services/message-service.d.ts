import * as Promise from 'bluebird';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { MessageEmitResponse, MessageEvent, MessageWorkerEvent, ReceiptContext } from '../utils/message-types';
import { ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
export declare abstract class MessageService extends WorkerClient<string | null> implements ServiceListener, ServiceEmitter {
    protected static logger: Logger;
    private static _app;
    private listening;
    private _eventListeners;
    protected static readonly app: express.Express;
    constructor(listener: boolean);
    listen(): void;
    registerEvent(registration: ServiceRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<MessageEmitResponse>;
    queueEvent(data: MessageWorkerEvent): void;
    fetchThread(_event: ReceiptContext, _filter: RegExp): Promise<string[]>;
    fetchPrivateMessages(_event: ReceiptContext, _filter: RegExp): Promise<string[]>;
    protected abstract activateMessageListener(): void;
    protected abstract sendMessage(data: ServiceEmitContext): Promise<MessageEmitResponse>;
    protected abstract getWorkerContextFromMessage(event: MessageWorkerEvent): string;
    protected abstract getEventTypeFromMessage(event: MessageEvent): string;
    protected handleEvent: (event: MessageEvent) => Promise<void>;
    protected getWorker: (event: MessageWorkerEvent) => Worker<string | null>;
    readonly abstract serviceName: string;
    readonly abstract apiHandle: ServiceAPIHandle | void;
}
