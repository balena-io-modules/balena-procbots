import * as Promise from 'bluebird';
import { MessengerConstructionDetails, TransmitContext } from './messenger-types';
import { ServiceEmitResponse, ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class MessengerService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private translators;
    private connectionDetails;
    protected connect(data: MessengerConstructionDetails): void;
    protected emitData(_data: TransmitContext): Promise<ServiceEmitResponse>;
    protected startListening(): void;
    protected verify(): boolean;
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: MessengerConstructionDetails): ServiceListener;
export declare function createServiceEmitter(data: MessengerConstructionDetails): ServiceEmitter;
