import * as Promise from 'bluebird';
import { FlowdockConstructor, FlowdockEmitContext, FlowdockHandle, FlowdockResponse } from './flowdock-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class FlowdockService extends ServiceScaffold<string> implements ServiceEmitter, ServiceListener {
    private static _serviceName;
    private session;
    private org;
    private postsSynced;
    constructor(data: FlowdockConstructor);
    protected emitData(context: FlowdockEmitContext): Promise<FlowdockResponse>;
    protected verify(): boolean;
    readonly serviceName: string;
    readonly apiHandle: FlowdockHandle;
}
export declare function createServiceListener(data: FlowdockConstructor): ServiceListener;
export declare function createServiceEmitter(data: FlowdockConstructor): ServiceEmitter;
