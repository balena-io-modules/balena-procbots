"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function makeGeneric(from, data) {
    const handlers = {
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
exports.makeGeneric = makeGeneric;
function makeSpecific(data) {
    const converters = {
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
exports.makeSpecific = makeSpecific;
function translateTrigger(trigger, service) {
    const translations = {
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
exports.translateTrigger = translateTrigger;
function initThreadHandleContext(event, to) {
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
exports.initThreadHandleContext = initThreadHandleContext;
function initMessageHandleContext(event, to) {
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
exports.initMessageHandleContext = initMessageHandleContext;
function initTransmitContext(event) {
    event = _.clone(event);
    return event;
}
exports.initTransmitContext = initTransmitContext;
function fromDiscoursePost(data) {
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS).join('|\\');
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS).join('|\\');
    const ignorePublic = `(?:\\[?(?:\\${pub}|\\${priv})\\]?)?`;
    const findSource = new RegExp(`^${ignorePublic}\\((\\S*)\\)`, 'i');
    const findContent = new RegExp(`^${ignorePublic}(?:\\(\\S*\\))?\\s?([\\s\\S]*)$`, 'i');
    const sourceArray = data.rawEvent.raw.match(findSource);
    const genesis = sourceArray === null ? data.source : sourceArray[1];
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
function fromDiscourseTopic(data) {
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
function fromFlowdockMessage(data) {
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS).join('|\\');
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS).join('|\\');
    const isPublic = new RegExp(`^\\[?\\${pub}\\]?`, 'i');
    const ignorePublic = `(?:\\[?(?:\\${pub}|\\${priv})\\]?)?`;
    const findSource = new RegExp(`^${ignorePublic}\\((\\S*)\\)`, 'i');
    const findContent = new RegExp(`^${ignorePublic}(?:\\(\\S*\\))?\\s?([\\s\\S]*)$`, 'i');
    const sourceArray = data.rawEvent.content.match(findSource);
    const genesis = sourceArray === null ? data.source : sourceArray[1];
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
function toDiscourseMessage(data) {
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS)[0];
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS)[0];
    const content = `[${data.private ? priv : pub}](${data.genesis})`
        + data.text;
    return {
        api_token: data.toIds.token,
        api_username: data.toIds.user,
        raw: content,
        topic_id: data.toIds.thread,
        whisper: data.private ? 'true' : 'false',
    };
}
function toFlowdockMessage(data) {
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS)[0];
    const priv = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS)[0];
    const content = `[${data.private ? priv : pub}](${data.genesis})`
        + data.text;
    return {
        content,
        event: 'message',
        external_user_name: data.toIds.user,
        flow: data.toIds.room,
        thread_id: data.toIds.thread,
    };
}
function toFlowdockThread(data) {
    const pub = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS)[0];
    return {
        content: `[${pub}](${data.genesis})${data.text}`,
        event: 'message',
        external_user_name: data.toIds.user,
        flow: data.toIds.room,
    };
}

//# sourceMappingURL=message-converters.js.map
