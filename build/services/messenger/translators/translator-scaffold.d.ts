import * as Promise from 'bluebird';
import { BasicMessageInformation, EmitInstructions, MessengerConstructor, MessengerEvent, MessengerResponse, TransmitInformation } from '../../messenger-types';
import { ServiceScaffoldEvent } from '../../service-scaffold-types';
import { Translator } from './translator';
import { EmitConverters, EventEquivalencies, ResponseConverters, TranslatorMetadata } from './translator-types';
export declare abstract class TranslatorScaffold implements Translator {
    protected static stringifyMetadata(data: BasicMessageInformation, format: string): string;
    protected static extractMetadata(message: string, format: string): TranslatorMetadata;
    private static metadataByRegex(message, regex);
    private static messageOfTheDay();
    private static getIndicatorArrays();
    protected abstract eventEquivalencies: EventEquivalencies;
    protected abstract emitConverters: EmitConverters;
    protected abstract responseConverters: ResponseConverters;
    messageIntoEmitDetails(message: TransmitInformation): Promise<EmitInstructions>;
    responseIntoMessageResponse(message: TransmitInformation, response: any): Promise<MessengerResponse>;
    eventIntoMessageType(event: MessengerEvent): string;
    messageTypeIntoEventTypes(type: string): string[];
    getAllEventTypes(): string[];
    abstract eventIntoMessage(event: ServiceScaffoldEvent): Promise<MessengerEvent>;
    abstract messageIntoEmitterConstructor(message: TransmitInformation): Promise<object>;
    abstract mergeGenericDetails(connectionDetails: object, genericDetails: MessengerConstructor): object;
}
