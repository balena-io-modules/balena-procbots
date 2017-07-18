"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const TypedError = require("typed-error");
const _ = require("lodash");
const worker_1 = require("../framework/worker");
const worker_client_1 = require("../framework/worker-client");
const logger_1 = require("../utils/logger");
class Messenger extends worker_client_1.WorkerClient {
    constructor(listener) {
        super();
        this.listening = false;
        this._eventListeners = {};
        this.listen = () => {
            if (!this.listening) {
                this.listening = true;
                this.activateMessageListener();
                Messenger.logger.log(logger_1.LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
            }
        };
        this.handleEvent = (event) => {
            const listeners = this._eventListeners[event.cookedEvent.type] || [];
            return Promise.map(listeners, (listener) => {
                return listener.listenerMethod(listener, event);
            }).return();
        };
        this.getWorker = (event) => {
            const context = event.data.cookedEvent.context;
            const retrieved = this.workers.get(context);
            if (retrieved) {
                return retrieved;
            }
            const created = new worker_1.Worker(context, this.removeWorker);
            this.workers.set(context, created);
            return created;
        };
        if (listener) {
            process.nextTick(this.listen);
        }
    }
    static initInterimContext(event, to, toIds = {}) {
        return {
            action: event.action,
            first: event.first,
            genesis: event.genesis,
            hidden: event.hidden,
            source: event.source,
            sourceIds: event.sourceIds,
            tags: event.tags,
            text: event.text,
            title: event.title,
            to,
            toIds,
        };
    }
    static getIndicatorArrays() {
        let shown;
        let hidden;
        try {
            shown = JSON.parse(process.env.MESSAGE_CONVERTER_PUBLICITY_INDICATORS_OBJECT);
            hidden = JSON.parse(process.env.MESSAGE_CONVERTER_PRIVACY_INDICATORS_OBJECT);
        }
        catch (error) {
            throw new Error('Message converter environment variables not set correctly, indicators not json');
        }
        if (shown.length === 0 || hidden.length === 0) {
            throw new Error('Message converter environment variables not set correctly, indicators zero length');
        }
        return { hidden, shown };
    }
    static stringifyMetadata(data, format) {
        const indicators = Messenger.getIndicatorArrays();
        switch (format.toLowerCase()) {
            case 'human':
                return `\n(${data.hidden ? indicators.hidden.word : indicators.shown.word} from ${data.source})`;
            case 'emoji':
                return `\n[${data.hidden ? indicators.hidden.emoji : indicators.shown.emoji}](${data.source})`;
            case 'img':
                const baseUrl = process.env.MESSAGE_CONVERTER_IMG_BASE_URL;
                const hidden = data.hidden ? indicators.hidden.word : indicators.shown.word;
                const querystring = `?hidden=${hidden}&source=${encodeURI(data.source)}`;
                return `\n<img src="${baseUrl}${querystring}" height="18" />`;
            default:
                throw new Error(`${format} format not recognised`);
        }
    }
    static extractMetadata(message, format) {
        const indicators = Messenger.getIndicatorArrays();
        const wordCapture = `(${indicators.hidden.word}|${indicators.shown.word})`;
        const beginsLine = `(?:^|\\r|\\n)(?:\\s*)`;
        switch (format.toLowerCase()) {
            case 'human':
                const parensRegex = new RegExp(`${beginsLine}\\(${wordCapture} from (\\w*)\\)`, 'i');
                return Messenger.metadataByRegex(message, parensRegex);
            case 'emoji':
                const emojiCapture = `(${indicators.hidden.emoji}|${indicators.shown.emoji})`;
                const emojiRegex = new RegExp(`${beginsLine}\\[${emojiCapture}\\]\\((\\w*)\\)`, 'i');
                return Messenger.metadataByRegex(message, emojiRegex);
            case 'img':
                const baseUrl = _.escapeRegExp(process.env.MESSAGE_CONVERTER_IMG_BASE_URL);
                const querystring = `\\?hidden=${wordCapture}&source=(\\w*)`;
                const imgRegex = new RegExp(`${beginsLine}<img src="${baseUrl}${querystring}" height="18" \/>`, 'i');
                return Messenger.metadataByRegex(message, imgRegex);
            case 'char':
                const charCapture = `(${indicators.hidden.char}|${indicators.shown.char})`;
                const charRegex = new RegExp(`${beginsLine}${charCapture}`, 'i');
                return Messenger.metadataByRegex(message, charRegex);
            default:
                throw new Error(`${format} format not recognised`);
        }
    }
    static messageOfTheDay() {
        try {
            const messages = JSON.parse(process.env.MESSAGE_CONVERTER_MESSAGES_OF_THE_DAY);
            const daysSinceDatum = Math.floor(new Date().getTime() / 86400000);
            return messages[daysSinceDatum % messages.length];
        }
        catch (error) {
            throw new Error('Message converter environment variables not set correctly, motd not json');
        }
    }
    static metadataByRegex(message, regex) {
        const indicators = Messenger.getIndicatorArrays();
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
    static get expressApp() {
        if (!Messenger._expressApp) {
            const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
            if (!port) {
                throw new Error('No inbound port specified for express server');
            }
            Messenger._expressApp = express();
            Messenger._expressApp.use(bodyParser.json());
            Messenger._expressApp.listen(port);
            Messenger.logger.log(logger_1.LogLevel.INFO, `---> Started MessageService shared web server on port '${port}'`);
        }
        return Messenger._expressApp;
    }
    registerEvent(registration) {
        for (const event of registration.events) {
            if (!this._eventListeners[event]) {
                this._eventListeners[event] = [];
            }
            this._eventListeners[event].push(registration);
        }
    }
    sendData(data) {
        if (data.contexts[this.serviceName]) {
            return this.sendPayload(data.contexts[this.serviceName]);
        }
        return Promise.resolve({
            err: new TypedError(`No ${this.serviceName} context`),
            source: this.serviceName,
        });
    }
    queueEvent(data) {
        super.queueEvent(data);
    }
}
Messenger.logger = new logger_1.Logger();
exports.Messenger = Messenger;

//# sourceMappingURL=messenger.js.map
