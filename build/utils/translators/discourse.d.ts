import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent } from '../../services/discourse-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import * as Translator from './translator';
export declare class DiscourseTranslator implements Translator.Translator {
    private connectionDetails;
    constructor(data: DiscourseConnectionDetails);
    eventIntoCreateMessage(event: DiscourseEvent): Promise<MessageContext>;
    messageIntoEmit(message: TransmitContext): Promise<DiscourseEmitContext>;
    eventNameIntoTriggers(name: string): string[];
}
export declare function createTranslator(data: DiscourseConnectionDetails): Translator.Translator;
