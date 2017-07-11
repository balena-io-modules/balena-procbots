import * as Promise from 'bluebird';
import { FlowdockConnectionDetails, FlowdockEmitContext, FlowdockEvent } from '../services/flowdock-types';
import { MessageContext, TransmitContext } from '../services/messenger-types';
import { MessageTranslator } from './translator';
export declare class FlowdockTranslator extends MessageTranslator {
    private session;
    private org;
    constructor(data: FlowdockConnectionDetails);
    dataIntoMessage(_data: FlowdockEvent): Promise<MessageContext>;
    messageIntoEmit(_message: TransmitContext): Promise<FlowdockEmitContext>;
    eventIntoEvents(_eventName: string): string[];
}
export declare function createTranslator(data: FlowdockConnectionDetails): MessageTranslator;
