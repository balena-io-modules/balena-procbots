import * as Promise from 'bluebird';
import { FlowdockConstructor, FlowdockEmitContext, FlowdockHandle } from './flowdock-types';
import { Messenger } from './messenger';
import { DataHub, MessengerEmitResponse, MessengerEvent, ReceiptContext, TransmitContext } from './messenger-types';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class FlowdockService extends Messenger implements ServiceEmitter, ServiceListener, DataHub {
    private static _serviceName;
    private session;
    private data;
    constructor(data: FlowdockConstructor, listen?: boolean);
    makeGeneric: (data: MessengerEvent) => Promise<ReceiptContext>;
    makeSpecific: (data: TransmitContext) => Promise<FlowdockEmitContext>;
    translateEventName(eventType: string): string;
    fetchNotes: (thread: string, room: string, filter: RegExp, search?: string | undefined) => Promise<string[]>;
    fetchValue(user: string, key: string): Promise<string>;
    protected activateMessageListener: () => void;
    protected sendPayload: (data: FlowdockEmitContext) => Promise<MessengerEmitResponse>;
    private fetchPrivateMessages(username, filter);
    private fetchUserId;
    private fetchFromSession;
    readonly serviceName: string;
    readonly apiHandle: FlowdockHandle;
}
export declare function createServiceListener(data: FlowdockConstructor): ServiceListener;
export declare function createServiceEmitter(data: FlowdockConstructor): ServiceEmitter;
export declare function createMessageService(data: FlowdockConstructor): Messenger;
export declare function createDataHub(data: FlowdockConstructor): DataHub;
