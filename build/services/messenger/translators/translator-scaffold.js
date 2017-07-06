"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const translator_1 = require("./translator");
class TranslatorScaffold {
    static stringifyMetadata(data, format) {
        const indicators = data.details.hidden ?
            TranslatorScaffold.getIndicatorArrays().hidden :
            TranslatorScaffold.getIndicatorArrays().shown;
        switch (format) {
            case 'human':
                return `(${indicators.word} from ${data.source.service})`;
            case 'emoji':
                return `[${indicators.emoji}](${data.source.service})`;
            case 'logo':
                const baseUrl = process.env.MESSAGE_TRANSLATOR_IMG_BASE_URL;
                const queryString = `?hidden=${indicators.word}&source=${data.source.service}`;
                return `<img src="${baseUrl}${queryString}" height="18" \/> ${TranslatorScaffold.messageOfTheDay()}`;
            default:
                throw new Error(`${format} format not recognised`);
        }
    }
    static extractMetadata(message, format) {
        const indicators = TranslatorScaffold.getIndicatorArrays();
        const wordCapture = `(${indicators.hidden.word}|${indicators.shown.word})`;
        const beginsLine = '(?:^|\\r|\\n)(?:\\s*)';
        const endsLine = '(?:\\s*)(?:$|\\r|\\n)';
        switch (format.toLowerCase()) {
            case 'char':
                const charCapture = `(${_.escapeRegExp(indicators.hidden.char)}|${_.escapeRegExp(indicators.shown.char)})`;
                const charRegex = new RegExp(`${beginsLine}${charCapture}`);
                return TranslatorScaffold.metadataByRegex(message, charRegex);
            case 'human':
                const parensRegex = new RegExp(`${beginsLine}\\(${wordCapture} from (\\w*)\\)${endsLine}`, 'i');
                return TranslatorScaffold.metadataByRegex(message, parensRegex);
            case 'emoji':
                const emojiCapture = `(${indicators.hidden.emoji}|${indicators.shown.emoji})`;
                const emojiRegex = new RegExp(`${beginsLine}\\[?${emojiCapture}\\]?\\(?(\\w*)\\)?`, 'i');
                return TranslatorScaffold.metadataByRegex(message, emojiRegex);
            case 'logo':
                const baseUrl = _.escapeRegExp(process.env.MESSAGE_TRANSLATOR_IMG_BASE_URL);
                const query = `\\?hidden=${wordCapture}&source=(\\w*)`;
                const imgRegex = new RegExp(`<img src="${baseUrl}${query}" height="18" \/>(?:.*)${endsLine}`, 'i');
                return TranslatorScaffold.metadataByRegex(message, imgRegex);
            default:
                throw new Error(`${format} format not recognised`);
        }
    }
    static metadataByRegex(message, regex) {
        const indicators = TranslatorScaffold.getIndicatorArrays();
        const metadata = message.match(regex);
        if (metadata) {
            return {
                content: message.replace(regex, '').trim(),
                genesis: metadata[2] || null,
                hidden: !_.includes(_.values(indicators.shown), metadata[1]),
            };
        }
        return {
            content: message.trim(),
            genesis: null,
            hidden: true,
        };
    }
    static messageOfTheDay() {
        try {
            const messages = JSON.parse(process.env.MESSAGE_TRANSLATOR_MESSAGES_OF_THE_DAY);
            const daysSinceDatum = Math.floor(new Date().getTime() / 86400000);
            return messages[daysSinceDatum % messages.length];
        }
        catch (error) {
            throw new Error('MESSAGE_TRANSLATOR_MESSAGES_OF_THE_DAY not set correctly, motd not json.');
        }
    }
    static getIndicatorArrays() {
        let indicators;
        try {
            indicators = JSON.parse(process.env.MESSAGE_TRANSLATOR_PRIVACY_INDICATORS);
        }
        catch (error) {
            throw new Error('MESSAGE_TRANSLATOR_PRIVACY_INDICATORS not JSON.');
        }
        if (indicators.shown.emoji && indicators.shown.char && indicators.shown.word &&
            indicators.hidden.emoji && indicators.hidden.char && indicators.hidden.word) {
            return indicators;
        }
        throw new Error('MESSAGE_TRANSLATOR_PRIVACY_INDICATORS not set correctly.');
    }
    messageIntoEmitDetails(message) {
        const converter = this.emitConverters[message.action];
        if (converter) {
            return converter(message);
        }
        return Promise.reject(new translator_1.TranslatorError(4, `${message.action} not translatable to ${message.target.service} yet.`));
    }
    responseIntoMessageResponse(message, response) {
        const converter = this.responseConverters[message.action];
        if (converter) {
            return converter(message, response);
        }
        return Promise.reject(new translator_1.TranslatorError(5, `Message action ${message.action} not translatable from ${message.target.service} yet.`));
    }
    eventIntoMessageType(event) {
        return _.findKey(this.eventEquivalencies, (value) => {
            return _.includes(value, event.type);
        }) || 'Unrecognised event';
    }
    messageTypeIntoEventTypes(type) {
        return this.eventEquivalencies[type];
    }
    getAllEventTypes() {
        return _.flatMap(this.eventEquivalencies);
    }
}
exports.TranslatorScaffold = TranslatorScaffold;

//# sourceMappingURL=translator-scaffold.js.map
