import * as Promise from 'bluebird';
import * as express from 'express';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { Logger } from '../utils/logger';
import { ServiceScaffoldServiceEvent, ServiceScaffoldWorkerEvent } from './service-scaffold-types';
import { ServiceAPIHandle, ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceListener, ServiceRegistration } from './service-types';
export declare abstract class ServiceScaffold<T> extends WorkerClient<T> implements ServiceListener, ServiceEmitter {
    private static singletonExpressApp;
    private instanceExpressApp?;
    private loggerInstance;
    private eventListeners;
    constructor(expressApp?: express.Express);
    registerEvent(registration: ServiceRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    protected queueData: (data: ServiceScaffoldServiceEvent) => void;
    protected abstract emitData(data: ServiceEmitContext): Promise<any>;
    protected abstract verify(data: ServiceScaffoldServiceEvent): boolean;
    protected getWorker: (event: ServiceScaffoldWorkerEvent) => Worker<T>;
    protected readonly expressApp: express.Express;
    protected readonly logger: Logger;
    protected readonly eventsRegistered: string[];
    protected handleEvent: (data: ServiceScaffoldServiceEvent) => Promise<void>;
    readonly abstract serviceName: string;
    readonly abstract apiHandle: ServiceAPIHandle | void;
}
