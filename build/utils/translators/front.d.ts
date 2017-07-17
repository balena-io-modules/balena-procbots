import * as Promise from 'bluebird';
import { FrontConnectionDetails, FrontEmitContext, FrontEvent } from '../../services/front-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import { Translator } from './translator';
export declare class FrontTranslator extends Translator {
    private session;
    private token;
    private channelPerInbox;
    constructor(data: FrontConnectionDetails);
    eventIntoMessage(event: FrontEvent): Promise<MessageContext>;
    messageIntoEmit(message: TransmitContext): Promise<FrontEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    private fetchUserId;
}
export declare function createTranslator(data: FrontConnectionDetails): Translator;
