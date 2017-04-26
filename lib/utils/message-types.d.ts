import {
    WorkerEvent,
} from '../framework/worker';
import {
    ServiceEmitContext,
    ServiceEmitResponse,
    ServiceEvent,
} from '../services/service-types';

type MessageReceiver = (data: MessageEvent) => ReceiptContext;

type MessageTransmitter = (data: TransmitContext) => ServiceEmitContext;

interface MessageEvent extends ServiceEvent {
    cookedEvent: {
        context: string;
        type: string;
        [key: string]: any;
    };
    rawEvent: any;
    source: string;
}
interface MessageWorkerEvent extends WorkerEvent {
    data: MessageEvent;
}

interface MessageIds {
    user?: string;
    message?: string;
    room?: string;
    thread?: string;
    token?: string;
}
interface MessageContext {
    action: 'create'|'update'|'delete';
    genesis: string;
    type: 'thread'|'message';
    private: boolean;
    source: string;
    sourceIds?: MessageIds;
    text: string;
    to?: string;
    toIds?: MessageIds;
}

interface ReceiptIds extends MessageIds {
    user: string;
    message?: string;
    room: string;
    thread: string;
}
interface ReceiptContext extends MessageContext {
    action: 'create';
    genesis: string;
    type: 'message' | 'thread';
    private: boolean;
    source: string;
    sourceIds: ReceiptIds;
    text: string;
}

interface MessageReceiptIds extends ReceiptIds {
    user: string;
    message: string;
    room: string;
    thread: string;
}
interface MessageReceiptContext extends ReceiptContext {
    action: 'create';
    genesis: string;
    type: 'message';
    private: boolean;
    source: string;
    sourceIds: MessageReceiptIds;
    text: string;
}

interface ThreadReceiptIds extends ReceiptIds {
    user: string;
    room: string;
    thread: string;
}
interface ThreadReceiptContext extends ReceiptContext {
    action: 'create';
    genesis: string;
    type: 'thread';
    private: false;
    source: string;
    sourceIds: ThreadReceiptIds;
    text: string;
}

interface HandleIds extends MessageIds {
    user?: string;
    room?: string;
    thread?: string;
    token?: string;
}
interface HandleContext extends MessageContext {
    action: 'create';
    genesis: string;
    type: 'message' | 'thread';
    private: boolean;
    source: string;
    sourceIds: ReceiptIds;
    text: string;
    to: string;
    toIds: HandleIds;
}

interface MessageHandleIds extends HandleIds {
    user?: string;
    room?: string;
    thread?: string;
    token?: string;
}
interface MessageHandleContext extends HandleContext {
    action: 'create';
    genesis: string;
    type: 'message';
    private: boolean;
    source: string;
    sourceIds: MessageReceiptIds;
    text: string;
    to: string;
    toIds: MessageHandleIds;
}

interface ThreadHandleIds extends HandleIds {
    user?: string;
    room?: string;
    token?: string;
}
interface ThreadHandleContext extends HandleContext {
    action: 'create';
    genesis: string;
    type: 'thread';
    private: false;
    source: string;
    sourceIds: ThreadReceiptIds;
    text: string;
    to: string;
    toIds: ThreadHandleIds;
}

interface TransmitIds extends MessageIds {
    user: string;
    room: string;
    thread?: string;
    token: string;
}
interface TransmitContext extends MessageContext {
    action: 'create';
    genesis: string;
    type: 'message' | 'thread';
    private: boolean;
    source: string;
    text: string;
    to: string;
    toIds: TransmitIds;
}

interface MessageTransmitIds extends TransmitIds {
    user: string;
    room: string;
    thread: string;
    token: string;
}
interface MessageTransmitContext extends TransmitContext {
    action: 'create';
    genesis: string;
    type: 'message';
    private: boolean;
    source: string;
    text: string;
    to: string;
    toIds: MessageTransmitIds;
}

interface ThreadTransmitIds extends TransmitIds {
    user: string;
    room: string;
    token: string;
}
interface ThreadTransmitContext extends TransmitContext {
    action: 'create';
    genesis: string;
    type: 'thread';
    private: boolean;
    source: string;
    text: string;
    to: string;
    toIds: ThreadTransmitIds;
}

interface MessageEmitResponse extends ServiceEmitResponse {
    response?: {
        ids: {
            message: string,
            thread: string,
        }
        [key: string]: any;
    };
    err?: any;
}
