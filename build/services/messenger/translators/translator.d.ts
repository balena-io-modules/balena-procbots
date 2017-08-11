import * as Promise from 'bluebird';
import { MessageContext, MessageEvent, MessageResponseData, Metadata, TransmitContext } from '../../messenger-types';
import { ServiceEvent } from '../../service-types';
import { DataHub } from '../datahubs/datahub';
export interface PublicityIndicator {
    emoji: string;
    word: string;
    char: string;
}
export interface Translator {
    eventIntoMessageType(event: MessageEvent): string;
    messageTypeIntoEventTypes(type: string): string[];
    getAllEventTypes(): string[];
    eventIntoMessage(event: ServiceEvent): Promise<MessageEvent>;
    messageIntoConnectionDetails(message: TransmitContext): Promise<object>;
    messageIntoEmitDetails(message: TransmitContext): {
        method: string[];
        payload: any;
    };
    responseIntoMessageResponse(payload: TransmitContext, response: any): MessageResponseData;
}
export declare function stringifyMetadata(data: MessageContext, format: string): string;
export declare function extractMetadata(message: string, format: string): Metadata;
export declare function createTranslator(name: string, data: any, hubs: DataHub[]): Translator;
