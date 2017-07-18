import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitContext, FlowdockEvent } from '../../services/flowdock-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import * as Translator from './translator';
export declare class FlowdockTranslator implements Translator.Translator {
    private session;
    private organization;
    constructor(data: FlowdockConnectionDetails);
    eventIntoMessage(event: FlowdockEvent): Promise<MessageContext>;
    messageIntoEmitCreateMessage(message: TransmitContext): Promise<FlowdockEmitContext>;
    messageIntoEmitReadHistory(_message: MessageContext): Promise<FlowdockEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    private fetchFromSession;
}
export declare function createTranslator(data: FlowdockConnectionDetails): Translator.Translator;
