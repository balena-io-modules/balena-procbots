import * as Promise from 'bluebird';
import { FrontConstructor, FrontEmitContext, FrontHandle } from './front-types';
import { Messenger } from './messenger';
import { MessengerEmitResponse, ReceiptContext, TransmitContext } from './messenger-types';
import { ServiceEmitter, ServiceEvent, ServiceListener } from './service-types';
export declare class FrontService extends Messenger implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private session;
    private data;
    constructor(data: FrontConstructor, listen?: boolean);
    fetchNotes: (thread: string, _room: string, filter: RegExp) => Promise<string[]>;
    makeGeneric: (data: ServiceEvent) => Promise<ReceiptContext>;
    makeSpecific: (data: TransmitContext) => Promise<FrontEmitContext>;
    translateEventName(eventType: string): string;
    protected activateMessageListener: () => void;
    protected sendPayload: (data: FrontEmitContext) => Promise<MessengerEmitResponse>;
    private fetchUserId;
    private findConversation;
    readonly serviceName: string;
    readonly apiHandle: FrontHandle;
}
export declare function createServiceListener(data: FrontConstructor): ServiceListener;
export declare function createServiceEmitter(data: FrontConstructor): ServiceEmitter;
export declare function createMessageService(data: FrontConstructor): Messenger;
