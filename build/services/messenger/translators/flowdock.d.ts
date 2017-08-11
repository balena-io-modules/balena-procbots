import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitData, FlowdockEvent, FlowdockResponse } from '../../flowdock-types';
import { MessageEvent, MessageResponseData, TransmitContext } from '../../messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';
export declare class FlowdockTranslator implements Translator.Translator {
    private hub;
    private session;
    private organization;
    private eventEquivalencies;
    constructor(data: FlowdockConnectionDetails, hub: DataHub);
    eventTypeIntoMessageType(type: string): string;
    messageTypeIntoEventTypes(type: string): string[];
    getAllEventTypes(): string[];
    eventIntoMessage(event: FlowdockEvent): Promise<MessageEvent>;
    messageIntoConnectionDetails(message: TransmitContext): Promise<FlowdockConnectionDetails>;
    messageIntoEmitCreateComment(message: TransmitContext): {
        method: string[];
        payload: FlowdockEmitData;
    };
    responseIntoMessageResponse(payload: TransmitContext, response: FlowdockResponse): MessageResponseData;
    private fetchFromSession;
}
export declare function createTranslator(data: FlowdockConnectionDetails, hub: DataHub): Translator.Translator;
