import * as Promise from 'bluebird';
import { InterimContext, MessageContext, MessageEvent, MessageIds, Metadata, TransmitContext } from '../../services/messenger-types';
import { ServiceEmitContext, ServiceEvent } from '../../services/service-types';
export interface Translator {
    eventIntoMessage(event: ServiceEvent): Promise<MessageEvent>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<ServiceEmitContext>;
    messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<ServiceEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    getAllTriggers(): string[];
}
export declare function initInterimContext(event: MessageContext, to: string, toIds?: MessageIds): InterimContext;
export declare function stringifyMetadata(data: MessageContext, format?: 'markdown' | 'plaintext'): string;
export declare function extractMetadata(message: string): Metadata;
export declare function createTranslator(name: string, data: any): Translator;
