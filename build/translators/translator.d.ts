import * as Promise from 'bluebird';
import { InterimContext, MessageContext, MessageIds, Metadata, TransmitContext } from '../services/messenger-types';
import { ServiceEmitContext, ServiceEvent } from '../services/service-types';
export declare abstract class MessageTranslator {
    static newTranslator(name: string, data: any): MessageTranslator;
    static initInterimContext(event: MessageContext, to: string, toIds?: MessageIds): InterimContext;
    protected static stringifyMetadata(data: MessageContext, format?: 'markdown' | 'plaintext'): string;
    protected static extractMetadata(message: string): Metadata;
    private static getIndicatorArrays();
    abstract dataIntoMessage(data: ServiceEvent): Promise<MessageContext>;
    abstract messageIntoEmit(message: TransmitContext): Promise<ServiceEmitContext>;
    abstract eventIntoEvents(eventName: string): string[];
}
