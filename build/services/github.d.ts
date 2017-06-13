import * as Promise from 'bluebird';
import { Worker, WorkerEvent } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import { GithubConfigLocation, GithubConstructor, GithubHandle, GithubListenerConstructor, GithubRegistration } from './github-types';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceEvent, ServiceListener } from './service-types';
export declare class GithubError extends TypeError {
    message: string;
    documentationUrl: string;
    type: string;
    constructor(error: any);
}
export declare class GithubService extends WorkerClient<string> implements ServiceListener, ServiceEmitter {
    protected getWorker: (event: WorkerEvent) => Worker<string>;
    protected authToken: string;
    protected pem: string;
    protected githubApi: any;
    private integrationId;
    private eventTriggers;
    private ghApiAccept;
    private _serviceName;
    private logger;
    constructor(constObj: GithubListenerConstructor | GithubConstructor);
    registerEvent(registration: GithubRegistration): void;
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    readonly serviceName: string;
    readonly apiHandle: GithubHandle;
    getConfigurationFile(details: GithubConfigLocation): Promise<string | void>;
    protected handleGithubEvent: (event: ServiceEvent) => Promise<void>;
    protected authenticate(): Promise<void>;
}
export declare function createServiceListener(constObj: GithubListenerConstructor): ServiceListener;
export declare function createServiceEmitter(constObj: GithubConstructor): ServiceEmitter;
