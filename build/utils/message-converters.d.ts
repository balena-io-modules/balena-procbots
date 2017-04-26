import { ServiceEmitContext } from '../services/service-types';
import { MessageEvent, MessageHandleContext, MessageReceiptContext, MessageTransmitContext, ReceiptContext, ThreadHandleContext, ThreadReceiptContext, TransmitContext } from './message-types';
export declare function makeGeneric(from: string, data: MessageEvent): ReceiptContext;
export declare function makeSpecific(data: TransmitContext): ServiceEmitContext;
export declare function translateTrigger(trigger: string, service: string): string;
export declare function initThreadHandleContext(event: ThreadReceiptContext, to: string): ThreadHandleContext;
export declare function initMessageHandleContext(event: MessageReceiptContext, to: string): MessageHandleContext;
export declare function initTransmitContext(event: MessageHandleContext): MessageTransmitContext;
