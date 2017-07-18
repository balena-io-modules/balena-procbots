import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent } from '../../services/discourse-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import * as Translator from './translator';
export declare class DiscourseTranslator implements Translator.Translator {
    private connectionDetails;
    constructor(data: DiscourseConnectionDetails);
    eventIntoMessage(event: DiscourseEvent): Promise<MessageContext>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<DiscourseEmitContext>;
    messageIntoEmitReadHistory(message: MessageContext, shortlist: RegExp): Promise<DiscourseEmitContext>;
    eventNameIntoTriggers(name: string): string[];
}
export declare function createTranslator(data: DiscourseConnectionDetails): Translator.Translator;
