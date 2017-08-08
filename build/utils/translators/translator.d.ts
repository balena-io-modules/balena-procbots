import * as Promise from 'bluebird';
import { InterimContext, MessageContext, MessageEvent, MessageIds, Metadata, TransmitContext } from '../../services/messenger-types';
import { ServiceEmitContext, ServiceEvent } from '../../services/service-types';
import { DataHub } from '../datahubs/datahub';
export interface PublicityIndicator {
    emoji: string;
    word: string;
    char: string;
}
export interface Translator {
    eventIntoMessage(event: ServiceEvent): Promise<MessageEvent>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<ServiceEmitContext>;
    messageIntoConnectionDetails(message: TransmitContext): Promise<object>;
    messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<ServiceEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    getAllTriggers(): string[];
}
export declare function initInterimContext(event: MessageContext, target: MessageIds | string): InterimContext;
export declare function stringifyMetadata(data: MessageContext, format: string): string;
export declare function extractMetadata(message: string, format: string): Metadata;
export declare function createTranslator(name: string, data: any, hub: DataHub): Translator;
