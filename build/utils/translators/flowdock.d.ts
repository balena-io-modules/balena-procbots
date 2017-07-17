import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitContext, FlowdockEvent } from '../../services/flowdock-types';
import { MessageContext, TransmitContext } from '../../services/messenger-types';
import { Translator } from './translator';
export declare class FlowdockTranslator extends Translator {
    private session;
    private organization;
    constructor(data: FlowdockConnectionDetails);
    eventIntoMessage(event: FlowdockEvent): Promise<MessageContext>;
    messageIntoEmit(message: TransmitContext): Promise<FlowdockEmitContext>;
    eventNameIntoTriggers(name: string): string[];
    private fetchFromSession;
}
export declare function createTranslator(data: FlowdockConnectionDetails): Translator;
