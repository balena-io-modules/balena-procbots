import * as Promise from 'bluebird';
import { UrlOptions } from 'request';
import { RequestPromiseOptions } from 'request-promise';
import { DiscourseConstructor, DiscourseEmitContext, DiscourseHandle, DiscourseListenerConstructor, DiscourseResponse } from './discourse-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceScaffoldEvent } from './service-scaffold-types';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class DiscourseService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private postsSynced;
    private connectionDetails;
    constructor(data: DiscourseConstructor | DiscourseListenerConstructor);
    request(requestOptions: UrlOptions & RequestPromiseOptions): Promise<DiscourseResponse>;
    protected emitData(context: DiscourseEmitContext): Promise<DiscourseResponse>;
    protected verify(_data: ServiceScaffoldEvent): boolean;
    readonly serviceName: string;
    readonly apiHandle: DiscourseHandle;
}
export declare function createServiceListener(data: DiscourseListenerConstructor): ServiceListener;
export declare function createServiceEmitter(data: DiscourseConstructor): ServiceEmitter;
