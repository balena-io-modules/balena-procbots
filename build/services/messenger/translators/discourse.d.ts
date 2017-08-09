import * as Promise from 'bluebird';
import { DiscourseConnectionDetails, DiscourseEmitContext, DiscourseEvent } from '../../discourse-types';
import { MessageContext, MessageEvent, TransmitContext } from '../../messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';
export declare class DiscourseTranslator implements Translator.Translator {
    private hub;
    private connectionDetails;
    constructor(data: DiscourseConnectionDetails, hub: DataHub);
    messageIntoConnectionDetails(message: TransmitContext): Promise<DiscourseConnectionDetails>;
    eventIntoMessage(event: DiscourseEvent): Promise<MessageEvent>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<DiscourseEmitContext>;
    messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<DiscourseEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    getAllTriggers(): string[];
}
export declare function createTranslator(data: DiscourseConnectionDetails, hub: DataHub): Translator.Translator;
