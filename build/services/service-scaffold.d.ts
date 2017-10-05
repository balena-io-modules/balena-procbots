import TypedError = require('typed-error');
import * as Promise from 'bluebird';
import * as express from 'express';
import { RequestHandler } from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { ServiceScaffoldConstructor, ServiceScaffoldErrorCode, ServiceScaffoldEvent, ServiceScaffoldWorkerEvent } from './service-scaffold-types';
import { ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
export declare class ServiceScaffoldError extends TypedError {
    code: ServiceScaffoldErrorCode;
    constructor(code: ServiceScaffoldErrorCode, message: string);
}
export declare abstract class ServiceScaffold<T> extends WorkerClient<T> implements ServiceListener, ServiceEmitter {
    protected expressApp?: express.Express;
    private loggerInstance;
    private eventListeners;
    constructor(data: ServiceScaffoldConstructor);
    registerEvent(registration: ServiceRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    protected queueData: (data: ServiceScaffoldEvent) => void;
    protected abstract emitData(data: ServiceEmitContext): Promise<any>;
    protected abstract verify(data: ServiceScaffoldEvent): boolean;
    protected getWorker: (event: ServiceScaffoldWorkerEvent) => Worker<T>;
    protected registerHandler(path: string, handler: RequestHandler): void;
    protected readonly logger: Logger;
    protected readonly eventsRegistered: string[];
    protected handleEvent: (data: ServiceScaffoldEvent) => Promise<void>;
    readonly abstract serviceName: string;
    readonly abstract apiHandle: ServiceAPIHandle | void;
}
