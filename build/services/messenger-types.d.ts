import * as Promise from 'bluebird';
import { WorkerEvent } from '../framework/worker';
import { ServiceEmitContext, ServiceEmitResponse, ServiceEvent } from './service-types';
export interface MessengerEvent extends ServiceEvent {
    cookedEvent: {
        context: string;
        type: string;
        [key: string]: any;
    };
    rawEvent: any;
    source: string;
}
export interface MessengerWorkerEvent extends WorkerEvent {
    data: MessengerEvent;
}
export declare enum MessengerAction {
    Create = 0,
}
export interface MessengerIds {
    user?: string;
    message?: string;
    thread?: string;
    flow?: string;
    url?: string;
}
export interface MessengerContext {
    action: MessengerAction;
    first: boolean;
    genesis: string;
    hidden: boolean;
    source: string;
    sourceIds?: MessengerIds;
    text: string;
    title?: string;
}
export interface ReceiptIds extends MessengerIds {
    user: string;
    message: string;
    thread: string;
    flow: string;
}
export interface ReceiptContext extends MessengerContext {
    sourceIds: ReceiptIds;
}
export interface InterimIds extends MessengerIds {
    token?: string;
}
export interface InterimContext extends MessengerContext {
    sourceIds: ReceiptIds;
    to: string;
    toIds: InterimIds;
}
export interface TransmitIds extends MessengerIds {
    user: string;
    token: string;
    flow: string;
}
export interface TransmitContext extends MessengerContext {
    sourceIds: ReceiptIds;
    to: string;
    toIds: TransmitIds;
}
export interface MessengerEmitContext extends ServiceEmitContext {
    endpoint: object;
    meta?: any;
    payload: object;
}
export interface MessengerEmitResponse extends ServiceEmitResponse {
    response?: {
        message: string;
        thread: string;
        url?: string;
    };
    err?: Error;
}
export interface Metadata {
    genesis: string | null;
    hidden: boolean;
    content: string;
}
export interface FlowDefinition {
    service: string;
    flow: string;
}
export interface DataHub {
    fetchValue(user: string, value: string): Promise<string>;
}
