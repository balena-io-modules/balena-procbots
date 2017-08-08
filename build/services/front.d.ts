import * as Promise from 'bluebird';
import { FrontConnectionDetails, FrontEmitContext, FrontEvent, FrontHandle, FrontResponse } from './front-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class FrontService extends ServiceUtilities<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private session;
    constructor(data: FrontConnectionDetails, listen: boolean);
    protected emitData(context: FrontEmitContext): Promise<FrontResponse>;
    protected verify(_data: FrontEvent): boolean;
    private startListening();
    readonly serviceName: string;
    readonly apiHandle: FrontHandle;
}
export declare function createServiceListener(data: FrontConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: FrontConnectionDetails): ServiceEmitter;
