import * as Promise from 'bluebird';
import { FrontConnectionDetails, FrontEmitContext, FrontEvent, FrontHandle, FrontResponse } from './front-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class FrontService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private session;
    protected connect(data: FrontConnectionDetails): void;
    protected emitData(context: FrontEmitContext): Promise<FrontResponse>;
    protected startListening(): void;
    protected verify(_data: FrontEvent): boolean;
    readonly serviceName: string;
    readonly apiHandle: FrontHandle;
}
export declare function createServiceListener(data: FrontConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: FrontConnectionDetails): ServiceEmitter;
