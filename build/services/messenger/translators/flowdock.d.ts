import * as Promise from 'bluebird';
import { FlowdockConstructor, FlowdockEvent } from '../../flowdock-types';
import { MessengerConstructor, MessengerEvent, TransmitInformation } from '../../messenger-types';
import { DataHub } from '../datahubs/datahub';
import { Translator } from './translator';
import { TranslatorScaffold } from './translator-scaffold';
import { EmitConverters, ResponseConverters } from './translator-types';
export declare class FlowdockTranslator extends TranslatorScaffold implements Translator {
    private static createFormattedText(body, header?, footer?);
    private static fetchFromSession;
    private static convertCreateThreadResponse(org, message, response);
    private static convertReadConnectionResponse(message, response);
    private static convertUpdateThreadResponse(_message, _response);
    private static createThreadIntoEmit(orgId, message);
    private static createMessageIntoEmit(orgId, message);
    private static updateTagsIntoEmit(orgId, session, message);
    private static readConnectionIntoEmit(orgId, message);
    protected eventEquivalencies: {
        message: string[];
    };
    protected emitConverters: EmitConverters;
    protected responseConverters: ResponseConverters;
    private hubs;
    private session;
    private organization;
    constructor(data: FlowdockConstructor, hubs: DataHub[]);
    eventIntoMessage(event: FlowdockEvent): Promise<MessengerEvent>;
    messageIntoEmitterConstructor(message: TransmitInformation): Promise<FlowdockConstructor>;
    mergeGenericDetails(connectionDetails: FlowdockConstructor, genericDetails: MessengerConstructor): FlowdockConstructor;
}
export declare function createTranslator(data: FlowdockConstructor, hubs: DataHub[]): Translator;
