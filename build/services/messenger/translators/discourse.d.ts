import * as Promise from 'bluebird';
import { DiscourseConstructor } from '../../discourse-types';
import { MessengerConstructor, MessengerEvent, TransmitInformation } from '../../messenger-types';
import { ServiceScaffoldEvent } from '../../service-scaffold-types';
import { DataHub } from '../datahubs/datahub';
import { Translator } from './translator';
import { TranslatorScaffold } from './translator-scaffold';
import { EmitConverters, ResponseConverters } from './translator-types';
export declare class DiscourseTranslator extends TranslatorScaffold implements Translator {
    private static createThreadIntoEmit(message);
    private static createMessageIntoEmit(message);
    private static readConnectionIntoEmit(message);
    private static updateTagsIntoEmit(connectionDetails, message);
    private static convertCreateThreadResponse(instance, _message, response);
    private static convertReadConnectionResponse(message, response);
    private static convertUpdateThreadResponse(_message, _response);
    protected eventEquivalencies: {
        message: string[];
    };
    protected emitConverters: EmitConverters;
    protected responseConverters: ResponseConverters;
    private hubs;
    private connectionDetails;
    constructor(data: DiscourseConstructor, hubs: DataHub[]);
    eventIntoMessage(event: ServiceScaffoldEvent): Promise<MessengerEvent>;
    messageIntoEmitterConstructor(message: TransmitInformation): Promise<DiscourseConstructor>;
    mergeGenericDetails(connectionDetails: DiscourseConstructor, genericDetails: MessengerConstructor): DiscourseConstructor;
}
export declare function createTranslator(data: DiscourseConstructor, hubs: DataHub[]): Translator;
