import * as Promise from 'bluebird';
import { FrontConnectionDetails, FrontEmitContext, FrontEvent } from '../../services/front-types';
import { MessageContext, MessageEvent, TransmitContext } from '../../services/messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';
export declare class FrontTranslator implements Translator.Translator {
    private session;
    private hub;
    private token;
    private channelPerInbox;
    constructor(data: FrontConnectionDetails, hub: DataHub);
    messageIntoConnectionDetails(_message: TransmitContext): Promise<FrontConnectionDetails>;
    eventIntoMessage(event: FrontEvent): Promise<MessageEvent>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<FrontEmitContext>;
    messageIntoEmitReadThread(message: MessageContext, _shortlist?: RegExp): Promise<FrontEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    getAllTriggers(): string[];
    private fetchUserId;
}
export declare function createTranslator(data: FrontConnectionDetails, hub: DataHub): Translator.Translator;
