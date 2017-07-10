import * as Promise from 'bluebird';
import { FrontConnectionDetails, FrontEmitContext, FrontWorkerData } from '../services/front-types';
import { MessageContext, TransmitContext } from '../services/messenger-types';
import { MessageTranslator } from './translator';
export declare class FrontTranslator extends MessageTranslator {
    private session;
    constructor(data: FrontConnectionDetails);
    dataIntoMessage(_data: FrontWorkerData): Promise<MessageContext>;
    messageIntoEmit(_message: TransmitContext): Promise<FrontEmitContext>;
    eventIntoEvents(_eventName: string): string[];
}
export declare function createTranslator(data: FrontConnectionDetails): MessageTranslator;
