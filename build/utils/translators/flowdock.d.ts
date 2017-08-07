import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitContext, FlowdockEvent } from '../../services/flowdock-types';
import { MessageContext, MessageEvent, TransmitContext } from '../../services/messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';
export declare class FlowdockTranslator implements Translator.Translator {
    private hub;
    private session;
    private organization;
    constructor(data: FlowdockConnectionDetails, hub: DataHub);
    eventIntoMessage(event: FlowdockEvent): Promise<MessageEvent>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<FlowdockEmitContext>;
    messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<FlowdockEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    getAllTriggers(): string[];
    private fetchFromSession;
}
export declare function createTranslator(data: FlowdockConnectionDetails, hub: DataHub): Translator.Translator;
