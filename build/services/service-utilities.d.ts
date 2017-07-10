import * as Promise from 'bluebird';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { ServiceAPIHandle, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
import { UtilityEmitMethod, UtilityEndpointDefinition, UtilityWorkerData, UtilityWorkerEvent } from './service-utilities-types';
export declare abstract class ServiceUtilities extends WorkerClient<string> implements ServiceListener, ServiceEmitter {
    private _logger;
    private _expressApp;
    private eventListeners;
    private listening;
    constructor(data: object, listen: boolean);
    registerEvent(registration: ServiceRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    protected queueData(data: UtilityWorkerData): void;
    protected abstract startListening(): void;
    protected abstract getEmitter(data: UtilityEndpointDefinition): UtilityEmitMethod;
    protected abstract connect(data: object): void;
    protected abstract verify(data: UtilityWorkerData): boolean;
    protected getWorker: (event: UtilityWorkerEvent) => Worker<string>;
    protected readonly expressApp: express.Express;
    protected readonly logger: Logger;
    protected handleEvent: (data: UtilityWorkerData) => Promise<void>;
    private listen;
    readonly abstract serviceName: string;
    readonly abstract apiHandle: ServiceAPIHandle | void;
}
