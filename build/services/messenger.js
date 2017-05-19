"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
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
            shown = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLIC_INDICATORS);
            hidden = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVATE_INDICATORS);
        }
        catch (error) {
            throw new Error('Message convertor environment variables not set correctly');
        }
        if (shown.length === 0 || hidden.length === 0) {
            throw new Error('Message convertor environment variables not set correctly');
        }
        return { hidden, shown };
    }
    static stringifyMetadata(data, format = 'markdown') {
        const indicators = Messenger.getIndicatorArrays();
        switch (format) {
            case 'markdown':
                return `[${data.hidden ? indicators.hidden[0] : indicators.shown[0]}](${data.source})`;
            case 'plaintext':
                return `${data.hidden ? indicators.hidden[0] : indicators.shown[0]}${data.source}`;
            default:
                throw new Error(`${format} format not recognised`);
        }
    }
    static extractMetadata(message) {
        const indicators = Messenger.getIndicatorArrays();
        const visible = indicators.shown.join('|\\');
        const hidden = indicators.hidden.join('|\\');
        const findMetadata = new RegExp(`(?:^|\\r|\\n)(?:\\s*)\\[?(${hidden}|${visible})\\]?\\(?(\\w*)\\)?`, 'i');
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
    static get app() {
        if (!Messenger._app) {
            const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
            if (!port) {
                throw new Error('No inbound port specified for express server');
            }
            Messenger._app = express();
            Messenger._app.use(bodyParser.json());
            Messenger._app.listen(port);
            Messenger.logger.log(logger_1.LogLevel.INFO, `---> Started MessageService shared web server on port '${port}'`);
        }
        return Messenger._app;
    }
    registerEvent(registration) {
        for (const event of registration.events) {
            if (this._eventListeners[event] == null) {
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
            err: new Error(`No ${this.serviceName} context`),
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
