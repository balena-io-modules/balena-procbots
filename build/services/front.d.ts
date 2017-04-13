import * as Promise from 'bluebird';
import { FrontEmitterConstructor, FrontHandle } from './front-types';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceEvent } from './service-types';
export declare class FrontService implements ServiceEmitter {
    private frontSDK;
    private _serviceName;
    private eventTriggers;
    private apiKey;
    private logger;
    constructor(constObj: FrontEmitterConstructor);
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    readonly apiHandle: FrontHandle;
    readonly serviceName: string;
    protected handleFrontEvent: (event: ServiceEvent) => Promise<void>;
}
export declare function createServiceEmitter(constObj: FrontEmitterConstructor): ServiceEmitter;
