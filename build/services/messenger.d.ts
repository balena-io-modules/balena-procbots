import * as Promise from 'bluebird';
import { MessengerConstructor, MessengerResponse, TransmitInformation } from './messenger-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class MessengerService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private translators;
    constructor(data: MessengerConstructor);
    protected emitData(data: TransmitInformation): Promise<MessengerResponse>;
    protected verify(): boolean;
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: MessengerConstructor): ServiceListener;
export declare function createServiceEmitter(data: MessengerConstructor): ServiceEmitter;
