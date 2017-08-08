import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitContext, FlowdockHandle, FlowdockResponse } from './flowdock-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class FlowdockService extends ServiceUtilities<string> implements ServiceEmitter, ServiceListener {
    private static _serviceName;
    private session;
    private org;
    constructor(data: FlowdockConnectionDetails, listen: boolean);
    protected emitData(context: FlowdockEmitContext): Promise<FlowdockResponse>;
    protected verify(): boolean;
    private startListening();
    readonly serviceName: string;
    readonly apiHandle: FlowdockHandle;
}
export declare function createServiceListener(data: FlowdockConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: FlowdockConnectionDetails): ServiceEmitter;
