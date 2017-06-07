import * as Promise from 'bluebird';
import { DiscourseConstructor, DiscourseEmitContext } from './discourse-types';
import { Messenger } from './messenger';
import { MessengerEmitResponse, MessengerEvent, ReceiptContext, TransmitContext } from './messenger-types';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class DiscourseService extends Messenger implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private postsSynced;
    private data;
    constructor(data: DiscourseConstructor, listen?: boolean);
    makeGeneric: (data: MessengerEvent) => Promise<ReceiptContext>;
    makeSpecific: (data: TransmitContext) => Promise<DiscourseEmitContext>;
    translateEventName(eventType: string): string;
    fetchNotes: (thread: string, _room: string, filter: RegExp) => Promise<string[]>;
    protected activateMessageListener: () => void;
    protected sendPayload: (data: DiscourseEmitContext) => Promise<MessengerEmitResponse>;
    readonly serviceName: string;
    readonly apiHandle: void;
}
export declare function createServiceListener(data: DiscourseConstructor): ServiceListener;
export declare function createServiceEmitter(data: DiscourseConstructor): ServiceEmitter;
export declare function createMessageService(data: DiscourseConstructor): Messenger;
