import * as Promise from 'bluebird';
import { UrlOptions } from 'request';
import { RequestPromiseOptions } from 'request-promise';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent, DiscourseHandle, DiscourseResponse } from './discourse-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class DiscourseService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private postsSynced;
    private connectionDetails;
    constructor(data: DiscourseConnectionDetails);
    request(requestOptions: UrlOptions & RequestPromiseOptions): Promise<DiscourseResponse>;
    protected emitData(context: DiscourseEmitContext): Promise<DiscourseResponse>;
    protected verify(_data: DiscourseEvent): boolean;
    readonly serviceName: string;
    readonly apiHandle: DiscourseHandle;
}
export declare function createServiceListener(data: DiscourseConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: DiscourseConnectionDetails): ServiceEmitter;
