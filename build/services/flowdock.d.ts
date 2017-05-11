import * as Promise from 'bluebird';
import { FlowdockHandle, FlowdockMessageEmitContext } from '../services/flowdock-types';
import { MessageEmitResponse, MessageEvent, MessageWorkerEvent, ReceiptContext } from '../utils/message-types';
import { MessageService } from './message-service';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class FlowdockService extends MessageService implements ServiceEmitter, ServiceListener {
    private static session;
    private static _serviceName;
    private flowIdToFlowName;
    fetchThread(event: ReceiptContext, filter: RegExp): Promise<string[]>;
    fetchPrivateMessages(event: ReceiptContext, filter: RegExp): Promise<string[]>;
    protected activateMessageListener(): void;
    protected getWorkerContextFromMessage(event: MessageWorkerEvent): string;
    protected getEventTypeFromMessage(event: MessageEvent): string;
    protected sendMessage(body: FlowdockMessageEmitContext): Promise<MessageEmitResponse>;
    readonly serviceName: string;
    readonly apiHandle: FlowdockHandle;
}
export declare function createServiceListener(): ServiceListener;
export declare function createServiceEmitter(): ServiceEmitter;
export declare function createMessageService(): MessageService;
