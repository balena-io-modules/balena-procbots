import * as Promise from 'bluebird';
import { MessageResponseData, MessengerConstructionDetails, TransmitInformation } from './messenger-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class MessengerService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private translators;
    constructor(data: MessengerConstructionDetails, listen: boolean);
    protected emitData(data: TransmitInformation): Promise<MessageResponseData>;
    protected verify(): boolean;
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: MessengerConstructionDetails): ServiceListener;
export declare function createServiceEmitter(data: MessengerConstructionDetails): ServiceEmitter;
