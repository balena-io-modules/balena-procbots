import * as Promise from 'bluebird';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
import { UtilityServiceEvent, UtilityWorkerEvent } from './service-utilities-types';
export declare abstract class ServiceUtilities<T> extends WorkerClient<T> implements ServiceListener, ServiceEmitter {
    private static _expressApp;
    private _logger;
    private _eventListeners;
    registerEvent(registration: ServiceRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    protected queueData: (data: UtilityServiceEvent) => void;
    protected abstract emitData(data: ServiceEmitContext): Promise<any>;
    protected abstract verify(data: UtilityServiceEvent): boolean;
    protected getWorker: (event: UtilityWorkerEvent) => Worker<T>;
    protected readonly expressApp: express.Express;
    protected readonly logger: Logger;
    protected readonly eventsRegistered: string[];
    protected handleEvent: (data: UtilityServiceEvent) => Promise<void>;
    readonly abstract serviceName: string;
    readonly abstract apiHandle: ServiceAPIHandle | void;
}
