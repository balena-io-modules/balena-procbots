import * as Promise from 'bluebird';
import { MessageResponseData, MessengerConstructionDetails, TransmitContext } from './messenger-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class MessengerService extends ServiceUtilities<string> implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private translators;
    constructor(data: MessengerConstructionDetails, listen: boolean);
    protected emitData(data: TransmitContext): Promise<MessageResponseData>;
    protected verify(): boolean;
    private startListening(connectionDetails);
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: MessengerConstructionDetails): ServiceListener;
export declare function createServiceEmitter(data: MessengerConstructionDetails): ServiceEmitter;
