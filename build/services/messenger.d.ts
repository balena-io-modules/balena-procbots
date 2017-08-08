import * as Promise from 'bluebird';
import { MessengerConstructionDetails, TransmitContext } from './messenger-types';
import { ServiceEmitResponse, ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class MessengerService extends ServiceUtilities<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private translators;
    private connectionDetails;
    constructor(data: MessengerConstructionDetails, listen: boolean);
    protected emitData(data: TransmitContext): Promise<ServiceEmitResponse>;
    protected verify(): boolean;
    private startListening();
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: MessengerConstructionDetails): ServiceListener;
export declare function createServiceEmitter(data: MessengerConstructionDetails): ServiceEmitter;
