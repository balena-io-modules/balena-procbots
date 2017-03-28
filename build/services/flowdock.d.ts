import * as Promise from 'bluebird';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter } from './service-types';
export declare class FlowdockService implements ServiceEmitter {
    private _serviceName;
    sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse>;
    readonly serviceName: string;
}
export declare function createServiceEmitter(): ServiceEmitter;
