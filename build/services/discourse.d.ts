import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent, DiscourseResponse } from './discourse-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class DiscourseService extends ServiceUtilities<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private postsSynced;
    private connectionDetails;
    constructor(data: DiscourseConnectionDetails, listen: boolean);
    protected emitData(context: DiscourseEmitContext): Promise<DiscourseResponse>;
    protected verify(_data: DiscourseEvent): boolean;
    private startListening();
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: DiscourseConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: DiscourseConnectionDetails): ServiceEmitter;
