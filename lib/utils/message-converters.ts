import * as _ from 'lodash';
import {
    DiscourseMessageEmitContext,
} from '../services/discourse-types';
import {
    FlowdockMessageEmitContext,
} from '../services/flowdock-types';
import {
    ServiceEmitContext,
    ServiceEvent,
} from '../services/service-types';
import {
    MessageEvent,
    MessageHandleContext,
    MessageReceiptContext,
    MessageReceiver,
    MessageTransmitContext,
    MessageTransmitter,
    ReceiptContext,
    ThreadHandleContext,
    ThreadReceiptContext,
    ThreadTransmitContext,
    TransmitContext,
} from './message-types';

/**
 * Generate a generic message object from an specific receipt object
 * @param from source of the data
 * @param data object to transform
 */
export function makeGeneric(from: string, data: MessageEvent): ReceiptContext {
    // A trivial hardcode -> retrieve -> execute block
    const handlers: { [from: string]: { [type: string]: MessageReceiver } } = {
        discourse: {
            post: fromDiscoursePost,
            topic: fromDiscourseTopic,
        },
        flowdock: {
            message: fromFlowdockMessage,
        },
    };
    return handlers[from][data.cookedEvent.type](data);
}

/**
 * Generate a specific emit object from a generic message object
 * @param data object to transform
 */
export function makeSpecific(data: TransmitContext): ServiceEmitContext {
    // A trivial hardcode -> retrieve -> execute block
    const converters: { [to: string]: { [type: string]: MessageTransmitter } } = {
        discourse: {
            message: toDiscourseMessage,
        },
        flowdock: {
            message: toFlowdockMessage,
            thread: toFlowdockThread,
        },
    };
    return converters[data.to][data.type](data);
}

/**
 * Generic a specific event type string from a generic message type string
 * @param trigger generic name for the event of interest
 * @param service adapter concerned
 */
export function translateTrigger(trigger: string, service: string): string {
    // A trivial hardcode -> retrieve block
    const translations: { [service: string]: { [trigger: string]: string } } = {
        discourse: {
            message: 'post',
            thread: 'topic',
        },
        flowdock: {
            message: 'message',
        },
    };
    return translations[service][trigger];
}

/**
 * Add accumulator objects for migration of an event towards its emitter
 * @param event received event
 * @param to destination of this event
 */
export function initThreadHandleContext(event: ThreadReceiptContext, to: string): ThreadHandleContext {
    return {
        action: event.action,
        genesis: event.genesis,
        private: event.private,
        source: event.source,
        sourceIds: event.sourceIds,
        text: event.text,
        to,
        toIds: {},
        type: event.type,
    };
}

/**
 * Add accumulator objects for migration of an event towards its emitter
 * @param event received event
 * @param to destination of this event
 */
export function initMessageHandleContext(event: MessageReceiptContext, to: string): MessageHandleContext {
    return {
        action: event.action,
        genesis: event.genesis,
        private: event.private,
        source: event.source,
        sourceIds: event.sourceIds,
        text: event.text,
        to,
        toIds: {},
        type: event.type,
    };
}

/**
 * Ensure that an object has accumulated all of its details
 * @param event candidate event for emitting
 */
export function initTransmitContext(event: MessageHandleContext): MessageTransmitContext {
    event = _.clone(event);
    return event as MessageTransmitContext;
}

/**
 * Convert an event from the form the adapter enqueues into a more generic message event
 * @param data enqueued object, raw from the adapter
 */
function fromDiscoursePost(data: ServiceEvent): MessageReceiptContext {
    // Retrieve publicity indicators from the environment
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS).join('|\\');
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS).join('|\\');
    // A regex that looks for publicity indicators, possibly inside [], and then doesn't capture them
    const ignorePublic = `(?:\\[?(?:\\${pub}|\\${priv})\\]?)?`;
    // Ignore the public indicator then capture non whitespace characters within literal parentheses
    const findSource = new RegExp(`^${ignorePublic}\\((\\S*)\\)`, 'i');
    // Ignore the public indicator and the source section then capture everything
    const findContent = new RegExp(`^${ignorePublic}(?:\\(\\S*\\))?\\s?([\\s\\S]*)$`, 'i');
    // Extract the encoded genesis for this event
    const sourceArray: string[] = data.rawEvent.raw.match(findSource);
    const genesis = sourceArray === null ? data.source : sourceArray[1];
    // Create and return the generic message event
    return {
        action: 'create',
        genesis,
        private: data.rawEvent.post_type === 4,
        source: 'discourse',
        sourceIds: {
            message: data.rawEvent.id,
            room: data.cookedEvent.category,
            thread: data.rawEvent.topic_id,
            user: data.rawEvent.username,
        },
        text: data.rawEvent.raw.match(findContent)[1],
        type: 'message',
    };
}

/**
 * Convert an event from the form the adapter enqueues into a more generic message event
 * @param data enqueued object, raw from the adapter
 */
function fromDiscourseTopic(data: ServiceEvent): ThreadReceiptContext {
    // Create and return the generic message event
    return {
        action: 'create',
        genesis: data.source,
        private: false,
        source: data.source,
        sourceIds: {
            message: `topic_${data.rawEvent.id}`,
            room: data.rawEvent.category_id,
            thread: data.rawEvent.id,
            user: data.rawEvent.details.created_by.username,
        },
        text: data.rawEvent.title,
        type: 'thread',
    };
}

/**
 * Convert an event from the form the adapter enqueues into a more generic message event
 * @param data enqueued object, raw from the adapter
 */
function fromFlowdockMessage(data: ServiceEvent): MessageReceiptContext {
    // Retrieve publicity indicators from the environment
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS).join('|\\');
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS).join('|\\');
    // A regex that looks for the presence of a public indicator
    const isPublic = new RegExp(`^\\[?\\${pub}\\]?`, 'i');
    // A regex that looks for publicity indicators, possibly inside [], and then doesn't capture them
    const ignorePublic = `(?:\\[?(?:\\${pub}|\\${priv})\\]?)?`;
    // Ignore the public indicator then capture non whitespace characters within literal parentheses
    const findSource = new RegExp(`^${ignorePublic}\\((\\S*)\\)`, 'i');
    // Ignore the public indicator and the source section then capture everything
    const findContent = new RegExp(`^${ignorePublic}(?:\\(\\S*\\))?\\s?([\\s\\S]*)$`, 'i');
    // Extract the encoded genesis for this event
    const sourceArray: string[] = data.rawEvent.content.match(findSource);
    const genesis = sourceArray === null ? data.source : sourceArray[1];
    // Create and return the generic message event
    return {
        action: 'create',
        genesis,
        private: data.rawEvent.content.match(isPublic) === null,
        source: data.source,
        sourceIds: {
            message: data.rawEvent.id,
            room: data.cookedEvent.flow,
            thread: data.rawEvent.thread_id,
            user: data.rawEvent.user,
        },
        text: data.rawEvent.content.match(findContent)[1],
        type: 'message',
    };
}

/**
 * Convert an event from a generic message event into a form specific to the adapter
 * @param data generic form of the event
 */
function toDiscourseMessage(data: MessageTransmitContext): DiscourseMessageEmitContext {
    // Retrieve publicity indicators from the environment
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS)[0];
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS)[0];
    // Build the content with the indicator and genesis at the front
    const content =
        `[${data.private ? priv : pub}](${data.genesis})`
        + data.text;
    // Create and return the generic message event
    return {
        api_token: data.toIds.token,
        api_username: data.toIds.user,
        raw: content,
        topic_id: data.toIds.thread,
        whisper: data.private ? 'true' : 'false',
    };
}

/**
 * Convert an event from a generic message event into a form specific to the adapter
 * @param data generic form of the event
 */
function toFlowdockMessage(data: MessageTransmitContext): FlowdockMessageEmitContext {
    // Retrieve publicity indicators from the environment
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS)[0];
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS)[0];
    // Build the content with the indicator and genesis at the front
    const content =
        `[${data.private ? priv : pub}](${data.genesis})`
        + data.text;
    // Create and return the generic message event
    return {
        content,
        event: 'message',
        external_user_name: data.toIds.user,
        flow: data.toIds.room,
        thread_id: data.toIds.thread,
    };
}

/**
 * Convert an event from a generic message event into a form specific to the adapter
 * @param data generic form of the event
 */
function toFlowdockThread(data: ThreadTransmitContext): FlowdockMessageEmitContext {
    // Retrieve publicity indicators from the environment
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS)[0];
    // Create and return the generic message event
    return {
        content: `[${pub}](${data.genesis})${data.text}`,
        event: 'message',
        external_user_name: data.toIds.user,
        flow: data.toIds.room,
    };
}
