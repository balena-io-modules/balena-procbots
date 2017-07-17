import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent } from '../../services/discourse-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import { Translator } from './translator';
export declare class DiscourseTranslator extends Translator {
    private connectionDetails;
    constructor(data: DiscourseConnectionDetails);
    eventIntoMessage(event: DiscourseEvent): Promise<MessageContext>;
    messageIntoEmit(message: TransmitContext): Promise<DiscourseEmitContext>;
    eventNameIntoTriggers(name: string): string[];
}
export declare function createTranslator(data: DiscourseConnectionDetails): Translator;
