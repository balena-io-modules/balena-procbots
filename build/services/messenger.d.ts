import * as Promise from 'bluebird';
import { MessengerConnectionDetails, TransmitContext } from './messenger-types';
import { ServiceEmitResponse, ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
export declare class MessengerService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private translators;
    private hub;
    private connectionDetails;
    protected connect(data: MessengerConnectionDetails): void;
    protected emitData(_data: TransmitContext): Promise<ServiceEmitResponse>;
    protected startListening(): void;
    protected verify(): boolean;
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: MessengerConnectionDetails): ServiceListener;
export declare function createServiceEmitter(data: MessengerConnectionDetails): ServiceEmitter;
