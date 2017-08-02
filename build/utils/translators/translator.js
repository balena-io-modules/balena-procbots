"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function initInterimContext(event, target) {
    return {
        details: event.details,
        source: event.source,
        target: _.isString(target) ? { service: target } : target,
    };
}
exports.initInterimContext = initInterimContext;
function stringifyMetadata(data, format = 'markdown') {
    const indicators = getIndicatorArrays();
    switch (format) {
        case 'markdown':
            return `[${data.details.hidden ? indicators.hidden.word : indicators.shown.word}](${data.source})`;
        case 'plaintext':
            return `${data.details.hidden ? indicators.hidden.word : indicators.shown.word}:${data.source}`;
        default:
            throw new Error(`${format} format not recognised`);
    }
}
exports.stringifyMetadata = stringifyMetadata;
function extractMetadata(message, format) {
    const indicators = getIndicatorArrays();
    const wordCapture = `(${indicators.hidden.word}|${indicators.shown.word})`;
    const beginsLine = `(?:^|\\r|\\n)(?:\\s*)`;
    switch (format.toLowerCase()) {
        case 'human':
            const parensRegex = new RegExp(`${beginsLine}\\(${wordCapture} from (\\w*)\\)`, 'i');
            return metadataByRegex(message, parensRegex);
        case 'emoji':
            const emojiCapture = `(${indicators.hidden.emoji}|${indicators.shown.emoji})`;
            const emojiRegex = new RegExp(`${beginsLine}\\[${emojiCapture}\\]\\((\\w*)\\)`, 'i');
            return metadataByRegex(message, emojiRegex);
        case 'img':
            const baseUrl = _.escapeRegExp(process.env.MESSAGE_CONVERTER_IMG_BASE_URL);
            const querystring = `\\?hidden=${wordCapture}&source=(\\w*)`;
            const imgRegex = new RegExp(`${beginsLine}<img src="${baseUrl}${querystring}" height="18" \/>`, 'i');
            return metadataByRegex(message, imgRegex);
        case 'char':
            const charCapture = `(${indicators.hidden.char}|${indicators.shown.char})`;
            const charRegex = new RegExp(`${beginsLine}${charCapture}`, 'i');
            return metadataByRegex(message, charRegex);
        default:
            throw new Error(`${format} format not recognised`);
    }
}
exports.extractMetadata = extractMetadata;
function metadataByRegex(message, regex) {
    const indicators = getIndicatorArrays();
    const metadata = message.match(regex);
    if (metadata) {
        return {
            content: message.replace(regex, '').trim(),
            genesis: metadata[2] || null,
            hidden: !_.includes(_.values(indicators.shown), metadata[1]),
        };
    }
    return {
        content: message,
        genesis: null,
        hidden: true,
    };
}
function getIndicatorArrays() {
    let shown;
    let hidden;
    try {
        shown = JSON.parse(process.env.MESSAGE_TRANSLATOR_PUBLICITY_INDICATORS_OBJECT);
        hidden = JSON.parse(process.env.MESSAGE_TRANSLATOR_PRIVACY_INDICATORS_OBJECT);
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
