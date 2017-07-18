import * as Promise from 'bluebird';
import { FrontConnectionDetails, FrontEmitContext, FrontEvent } from '../../services/front-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import * as Translator from './translator';
export declare class FrontTranslator implements Translator.Translator {
    private session;
    private token;
    private channelPerInbox;
    constructor(data: FrontConnectionDetails);
    eventIntoMessage(event: FrontEvent): Promise<MessageContext>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<FrontEmitContext>;
    messageIntoEmitReadHistory(_message: MessageContext): Promise<FrontEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    private fetchUserId;
}
export declare function createTranslator(data: FrontConnectionDetails): Translator.Translator;
