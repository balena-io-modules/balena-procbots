import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent, DiscourseResponse } from './discourse-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class DiscourseService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private postsSynced;
    private connectionDetails;
    protected connect(data: DiscourseConnectionDetails): void;
    protected emitData(context: DiscourseEmitContext): Promise<DiscourseResponse>;
    protected startListening(): void;
    protected verify(_data: DiscourseEvent): boolean;
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: DiscourseConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: DiscourseConnectionDetails): ServiceEmitter;
