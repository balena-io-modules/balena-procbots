"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const worker_1 = require("../framework/worker");
const worker_client_1 = require("../framework/worker-client");
const logger_1 = require("../utils/logger");
class MessageService extends worker_client_1.WorkerClient {
    constructor(listener) {
        super();
        this.listening = false;
        this._eventListeners = {};
        this.handleEvent = (event) => {
            const listeners = this._eventListeners[event.cookedEvent.type] || [];
            return Promise.map(listeners, (listener) => {
                return listener.listenerMethod(listener, event);
            }).return();
        };
        this.getWorker = (event) => {
            const context = this.getWorkerContextFromMessage(event);
            const retrieved = this.workers.get(context);
            if (retrieved) {
                return retrieved;
            }
            else {
                const created = new worker_1.Worker(context, this.removeWorker);
                this.workers.set(context, created);
                return created;
            }
        };
        if (listener) {
            this.listen();
        }
    }
    static get app() {
        const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
        if (!port) {
            throw new Error('No inbound port specified for express server');
        }
        if (!MessageService._app) {
            MessageService._app = express();
            MessageService._app.use(bodyParser.json());
            MessageService._app.listen(port);
        }
        return MessageService._app;
    }
    listen() {
        if (!this.listening) {
            this.listening = true;
            this.activateMessageListener();
            MessageService.logger.log(logger_1.LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
        }
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
            return this.sendMessage(data.contexts[this.serviceName]);
        }
        else {
            return Promise.resolve({
                err: new Error(`No ${this.serviceName} context`),
                source: this.serviceName,
            });
        }
    }
    queueEvent(data) {
        super.queueEvent(data);
    }
    fetchThread(_event, _filter) {
        return Promise.reject(new Error('Not yet implemented'));
    }
    fetchPrivateMessages(_event, _filter) {
        return Promise.reject(new Error('Not yet implemented'));
    }
}
MessageService.logger = new logger_1.Logger();
exports.MessageService = MessageService;

//# sourceMappingURL=message-service.js.map
