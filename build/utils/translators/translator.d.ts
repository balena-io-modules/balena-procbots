import * as Promise from 'bluebird';
import { InterimContext, MessageContext, MessageIds, Metadata, TransmitContext } from '../../services/messenger-types';
import { ServiceEmitContext, ServiceEvent } from '../../services/service-types';
export interface Translator {
    eventIntoCreateMessage(event: ServiceEvent): Promise<MessageContext>;
    messageIntoEmit(message: TransmitContext): Promise<ServiceEmitContext>;
    eventNameIntoTriggers(name: string): string[];
}
export declare function initInterimContext(event: MessageContext, to: string, toIds?: MessageIds): InterimContext;
export declare function stringifyMetadata(data: MessageContext, format?: 'markdown' | 'plaintext'): string;
export declare function extractMetadata(message: string): Metadata;
export declare function createTranslator(name: string, data: any): Translator;
