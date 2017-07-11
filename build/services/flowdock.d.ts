import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitContext, FlowdockHandle, FlowdockResponse } from './flowdock-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class FlowdockService extends ServiceUtilities implements ServiceEmitter, ServiceListener {
    private static _serviceName;
    private session;
    private org;
    protected connect(data: FlowdockConnectionDetails): void;
    protected emitData(context: FlowdockEmitContext): Promise<FlowdockResponse>;
    protected startListening(): void;
    protected verify(): boolean;
    readonly serviceName: string;
    readonly apiHandle: FlowdockHandle;
}
export declare function createServiceListener(data: FlowdockConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: FlowdockConnectionDetails): ServiceEmitter;
