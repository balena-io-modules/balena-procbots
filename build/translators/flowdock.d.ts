import * as Promise from 'bluebird';
import { FlowdockConstructor, FlowdockHandle } from './flowdock-types';
import { Messenger } from './messenger';
import { DataHub } from './messenger-types';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class FlowdockService extends Messenger implements ServiceEmitter, ServiceListener, DataHub {
    private static _serviceName;
    private session;
    private data;
    constructor(data: FlowdockConstructor, listen?: boolean);
    makeGeneric: (data: any) => Promise<any>;
    makeSpecific: (data: any) => Promise<any>;
    translateEventName(eventType: string): string;
    fetchNotes: (thread: string, room: string, filter: RegExp, search?: string | undefined) => Promise<string[]>;
    fetchValue(user: string, key: string): Promise<string>;
    protected activateMessageListener: () => void;
    protected sendPayload: (data: any) => Promise<any>;
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
