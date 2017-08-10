import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitData, FlowdockEvent } from '../../flowdock-types';
import { MessageContext, MessageEvent, TransmitContext } from '../../messenger-types';
import { DataHub } from '../datahubs/datahub';
import * as Translator from './translator';
export declare class FlowdockTranslator implements Translator.Translator {
    private hub;
    private session;
    private organization;
    constructor(data: FlowdockConnectionDetails, hub: DataHub);
    messageIntoConnectionDetails(message: TransmitContext): Promise<FlowdockConnectionDetails>;
    messageIntoMethodPath(_message: TransmitContext): Promise<string[]>;
    eventIntoMessage(event: FlowdockEvent): Promise<MessageEvent>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<FlowdockEmitData>;
    messageIntoEmitReadThread(message: MessageContext, shortlist?: RegExp): Promise<FlowdockEmitData>;
    eventNameIntoTriggers(name: string): string[];
    getAllTriggers(): string[];
    private fetchFromSession;
}
export declare function createTranslator(data: FlowdockConnectionDetails, hub: DataHub): Translator.Translator;
