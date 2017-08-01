"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function initInterimContext(event, to, toIds = {}) {
    return {
        first: event.first,
        genesis: event.genesis,
        hidden: event.hidden,
        source: event.source,
        sourceIds: event.sourceIds,
        text: event.text,
        title: event.title,
        to,
        toIds,
    };
}
exports.initInterimContext = initInterimContext;
function stringifyMetadata(data, format = 'markdown') {
    const indicators = getIndicatorArrays();
    switch (format) {
        case 'markdown':
            return `[${data.hidden ? indicators.hidden[0] : indicators.shown[0]}](${data.source})`;
        case 'plaintext':
            return `${data.hidden ? indicators.hidden[0] : indicators.shown[0]}:${data.source}`;
        default:
            throw new Error(`${format} format not recognised`);
    }
}
exports.stringifyMetadata = stringifyMetadata;
function extractMetadata(message) {
    const indicators = getIndicatorArrays();
    const visible = indicators.shown.join('|\\');
    const hidden = indicators.hidden.join('|\\');
    const findMetadata = new RegExp(`(?:^|\\r|\\n)(?:\\s*)\\[?(${hidden}|${visible})\\]?:?\\(?(\\w*)\\)?`, 'i');
    const metadata = message.match(findMetadata);
    if (metadata) {
        return {
            content: message.replace(findMetadata, '').trim(),
            genesis: metadata[2] || null,
            hidden: !_.includes(indicators.shown, metadata[1]),
        };
    }
    return {
        content: message,
        genesis: null,
        hidden: true,
    };
}
exports.extractMetadata = extractMetadata;
function getIndicatorArrays() {
    let shown;
    let hidden;
    try {
        shown = JSON.parse(process.env.MESSAGE_TRANSLATOR_PUBLIC_INDICATORS);
        hidden = JSON.parse(process.env.MESSAGE_TRANSLATOR_PRIVATE_INDICATORS);
    }
    catch (error) {
        throw new Error('Message convertor environment variables not set correctly');
    }
    if (shown.length === 0 || hidden.length === 0) {
        throw new Error('Message convertor environment variables not set correctly');
    }
    return { hidden, shown };
}
function createTranslator(name, data) {
    return require(`./${name}`).createTranslator(data);
}
exports.createTranslator = createTranslator;

//# sourceMappingURL=translator.js.map
