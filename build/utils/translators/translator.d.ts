import * as Promise from 'bluebird';
import { InterimContext, MessageContext, MessageIds, Metadata, TransmitContext } from '../../services/messenger-types';
import { ServiceEmitContext, ServiceEvent } from '../../services/service-types';
export declare abstract class Translator {
    static initInterimContext(event: MessageContext, to: string, toIds?: MessageIds): InterimContext;
    protected static stringifyMetadata(data: MessageContext, format?: 'markdown' | 'plaintext'): string;
    protected static extractMetadata(message: string): Metadata;
    private static getIndicatorArrays();
    abstract eventIntoMessage(event: ServiceEvent): Promise<MessageContext>;
    abstract messageIntoEmit(message: TransmitContext): Promise<ServiceEmitContext>;
    abstract eventNameIntoTriggers(name: string): string[];
}
export declare function createTranslator(name: string, data: any): Translator;
