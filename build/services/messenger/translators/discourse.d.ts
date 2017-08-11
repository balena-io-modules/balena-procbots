import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitData, DiscourseEvent, DiscourseResponse } from '../../discourse-types';
import { MessageEvent, MessageResponseData, TransmitContext } from '../../messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';
export declare class DiscourseTranslator implements Translator.Translator {
    private hub;
    private connectionDetails;
    private eventEquivalencies;
    constructor(data: DiscourseConnectionDetails, hub: DataHub);
    eventTypeIntoMessageType(type: string): string;
    messageTypeIntoEventTypes(type: string): string[];
    getAllEventTypes(): string[];
    eventIntoMessage(event: DiscourseEvent): Promise<MessageEvent>;
    messageIntoConnectionDetails(message: TransmitContext): Promise<DiscourseConnectionDetails>;
    messageIntoEmitCreateComment(message: TransmitContext): {
        method: string[];
        payload: DiscourseEmitData;
    };
    responseIntoMessageResponse(_payload: TransmitContext, response: DiscourseResponse): MessageResponseData;
}
export declare function createTranslator(data: DiscourseConnectionDetails, hub: DataHub): Translator.Translator;
