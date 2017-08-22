import * as Promise from 'bluebird';
import { MessageEvent, MessageInformation, MessageResponseData, Metadata, TransmitInformation } from '../../messenger-types';
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
    messageIntoConnectionDetails(message: TransmitInformation): Promise<object>;
    messageIntoEmitDetails(message: TransmitInformation): {
        method: string[];
        payload: any;
    };
    responseIntoMessageResponse(payload: TransmitInformation, response: any): MessageResponseData;
}
export declare function stringifyMetadata(data: MessageInformation, format: string): string;
export declare function extractMetadata(message: string, format: string): Metadata;
export declare function createTranslator(name: string, data: any, hubs: DataHub[]): Translator;
