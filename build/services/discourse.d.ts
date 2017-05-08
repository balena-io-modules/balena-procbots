import * as Promise from 'bluebird';
import { MessageEmitResponse, MessageEvent, MessageWorkerEvent, ReceiptContext } from '../utils/message-types';
import { DiscourseMessageEmitContext } from './discourse-types';
import { MessageService } from './message-service';
import { ServiceEmitter, ServiceListener } from './service-types';
export declare class DiscourseService extends MessageService implements ServiceListener, ServiceEmitter {
    private static _serviceName;
    private topicCache;
    private postsSynced;
    fetchThread(event: ReceiptContext, filter: RegExp): Promise<string[]>;
    protected activateMessageListener(): void;
    protected sendMessage(data: DiscourseMessageEmitContext): Promise<MessageEmitResponse>;
    protected getWorkerContextFromMessage(event: MessageWorkerEvent): string;
    protected getEventTypeFromMessage(event: MessageEvent): string;
    private fetchTopic(topicId);
    readonly serviceName: string;
}
export declare function createServiceListener(): ServiceListener;
export declare function createServiceEmitter(): ServiceEmitter;
export declare function createMessageService(): MessageService;
