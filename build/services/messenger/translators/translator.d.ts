import TypedError = require('typed-error');
import * as Promise from 'bluebird';
import { EmitInstructions, MessengerConstructor, MessengerEvent, MessengerResponse, TransmitInformation } from '../../messenger-types';
import { ServiceEvent } from '../../service-types';
import { DataHub } from '../datahubs/datahub';
import { TranslatorErrorCode } from './translator-types';
export declare class TranslatorError extends TypedError {
    code: TranslatorErrorCode;
    constructor(code: TranslatorErrorCode, message: string);
}
export interface Translator {
    eventIntoMessageType(event: MessengerEvent): string;
    messageTypeIntoEventTypes(type: string): string[];
    getAllEventTypes(): string[];
    eventIntoMessage(event: ServiceEvent): Promise<MessengerEvent>;
    messageIntoEmitterConstructor(message: TransmitInformation): Promise<object>;
    mergeGenericDetails(connectionDetails: object, genericDetails: MessengerConstructor): object;
    messageIntoEmitDetails(message: TransmitInformation): Promise<EmitInstructions>;
    responseIntoMessageResponse(message: TransmitInformation, response: any): Promise<MessengerResponse>;
}
export declare function createTranslator(name: string, data: any, hubs: DataHub[]): Translator;
