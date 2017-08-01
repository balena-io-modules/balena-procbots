import * as Promise from 'bluebird';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
import { UtilityServiceEvent, UtilityWorkerEvent } from './service-utilities-types';
export declare abstract class ServiceUtilities extends WorkerClient<string> implements ServiceListener, ServiceEmitter {
    private static _expressApp;
    private _logger;
    private eventListeners;
    private listening;
    constructor(data: object, listen: boolean);
    registerEvent(registration: ServiceRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    protected queueData: (data: UtilityServiceEvent) => void;
    protected abstract connect(data: any): void;
    protected abstract emitData(data: ServiceEmitContext): any;
    protected abstract startListening(): void;
    protected abstract verify(data: UtilityServiceEvent): boolean;
    protected getWorker: (event: UtilityWorkerEvent) => Worker<string>;
    protected readonly expressApp: express.Express;
    protected readonly logger: Logger;
    protected handleEvent: (data: UtilityServiceEvent) => Promise<void>;
    private listen;
    readonly abstract serviceName: string;
    readonly abstract apiHandle: ServiceAPIHandle | void;
}
