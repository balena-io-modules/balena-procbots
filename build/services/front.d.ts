import * as Promise from 'bluebird';
import { FrontConstructor, FrontEmitContext, FrontHandle, FrontListenerConstructor, FrontResponse } from './front-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceScaffoldEvent } from './service-scaffold-types';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class FrontService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private session;
    constructor(data: FrontConstructor | FrontListenerConstructor);
    protected emitData(context: FrontEmitContext): Promise<FrontResponse>;
    protected verify(_data: ServiceScaffoldEvent): boolean;
    readonly serviceName: string;
    readonly apiHandle: FrontHandle;
}
export declare function createServiceListener(data: FrontListenerConstructor): ServiceListener;
export declare function createServiceEmitter(data: FrontConstructor): ServiceEmitter;
