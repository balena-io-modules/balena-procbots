import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent } from '../services/discourse-types';
import { MessageContext, TransmitContext } from '../services/messenger-types';
import { MessageTranslator } from './translator';
export declare class DiscourseTranslator extends MessageTranslator {
    private connectionDetails;
    constructor(data: DiscourseConnectionDetails);
    dataIntoMessage(_data: DiscourseEvent): Promise<MessageContext>;
    messageIntoEmit(_message: TransmitContext): Promise<DiscourseEmitContext>;
    eventIntoEvents(_eventName: string): string[];
}
export declare function createTranslator(data: DiscourseConnectionDetails): MessageTranslator;
