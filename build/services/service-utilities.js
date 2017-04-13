"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypedError = require("typed-error");
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const worker_1 = require("../framework/worker");
const worker_client_1 = require("../framework/worker-client");
const logger_1 = require("../utils/logger");
class ServiceUtilities extends worker_client_1.WorkerClient {
    constructor() {
        super();
        this._logger = new logger_1.Logger();
        this.eventListeners = {};
        this.queueData = (data) => {
            if (this.verify(data)) {
                super.queueEvent({
                    data,
                    workerMethod: this.handleEvent
                });
            }
            else {
                this.logger.log(logger_1.LogLevel.WARN, `Event failed verification.`);
            }
        };
        this.getWorker = (event) => {
            const context = event.data.context;
            const retrieved = this.workers.get(context);
            if (retrieved) {
                return retrieved;
            }
            const created = new worker_1.Worker(context, this.removeWorker);
            this.workers.set(context, created);
            return created;
        };
        this.handleEvent = (data) => {
            const listeners = this.eventListeners[data.event] || [];
            return Promise.map(listeners, (listener) => {
                return listener.listenerMethod(listener, data);
            }).return();
        };
        this.logger.log(logger_1.LogLevel.INFO, `---> '${this.serviceName}' constructing.`);
    }
    registerEvent(registration) {
        for (const event of registration.events) {
            if (!this.eventListeners[event]) {
                this.eventListeners[event] = [];
            }
            this.eventListeners[event].push(registration);
        }
    }
    sendData(data) {
        const context = data.contexts[this.serviceName];
        if (!context) {
            return Promise.resolve({
                err: new TypedError(`No ${this.serviceName} context`),
                source: this.serviceName,
            });
        }
        return this.emitData(context).then((response) => {
            return {
                response,
                source: this.serviceName,
            };
        }).catch((err) => {
            return {
                err,
                source: this.serviceName,
            };
        });
    }
    get expressApp() {
        if (!ServiceUtilities._expressApp) {
            const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
            if (!port) {
                throw new Error('No inbound port specified for express server.');
            }
            ServiceUtilities._expressApp = express();
            ServiceUtilities._expressApp.use(bodyParser.json());
            ServiceUtilities._expressApp.listen(port);
            this.logger.log(logger_1.LogLevel.INFO, `---> Started ServiceUtility shared web server on port '${port}'.`);
        }
        return ServiceUtilities._expressApp;
    }
    get logger() {
        return this._logger;
    }
}
exports.ServiceUtilities = ServiceUtilities;

//# sourceMappingURL=service-utilities.js.map
