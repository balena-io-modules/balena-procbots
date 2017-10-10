import * as Promise from 'bluebird';
import { FrontConstructor } from '../../front-types';
import { MessengerConstructor, MessengerEvent, TransmitInformation } from '../../messenger-types';
import { ServiceScaffoldEvent } from '../../service-scaffold-types';
import { Translator } from './translator';
import { TranslatorScaffold } from './translator-scaffold';
import { EmitConverters, ResponseConverters } from './translator-types';
export declare class FrontTranslator extends TranslatorScaffold implements Translator {
    private static fetchAuthorName(connectionDetails, message);
    private static fetchContactName(connectionDetails, contactUrl);
    private static fetchSubject(connectionDetails, conversation);
    private static fetchUserId(token, username);
    private static findConversation;
    private static updateTagsIntoEmit(message);
    private static createThreadIntoEmit(connectionDetails, message);
    private static createMessageIntoEmit(connectionDetails, message);
    private static readConnectionIntoEmit(message);
    private static convertReadConnectionResponse(message, response);
    private static convertUpdateThreadResponse(_message, _response);
    private static convertCreateThreadResponse(session, message, _response);
    protected eventEquivalencies: {
        message: string[];
    };
    protected emitConverters: EmitConverters;
    protected responseConverters: ResponseConverters;
    private session;
    private connectionDetails;
    constructor(data: FrontConstructor);
    eventIntoMessage(event: ServiceScaffoldEvent): Promise<MessengerEvent>;
    messageIntoEmitterConstructor(_message: TransmitInformation): Promise<FrontConstructor>;
    mergeGenericDetails(connectionDetails: FrontConstructor, genericDetails: MessengerConstructor): FrontConstructor;
}
export declare function createTranslator(data: FrontConstructor): Translator;
