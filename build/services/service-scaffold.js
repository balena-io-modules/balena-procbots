"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TypedError = require("typed-error");
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const _ = require("lodash");
const worker_1 = require("../framework/worker");
const worker_client_1 = require("../framework/worker-client");
const logger_1 = require("../utils/logger");
class ServiceScaffoldError extends TypedError {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
exports.ServiceScaffoldError = ServiceScaffoldError;
class ServiceScaffold extends worker_client_1.WorkerClient {
    constructor(data) {
        super();
        this.loggerInstance = new logger_1.Logger();
        this.eventListeners = {};
        this.queueData = (data) => {
            if (this.verify(data)) {
                super.queueEvent({
                    data,
                    workerMethod: this.handleEvent
                });
            }
            else {
                this.logger.log(logger_1.LogLevel.WARN, `Event failed verification.\n${JSON.stringify(data)}`);
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
            const listeners = _.get(this.eventListeners, data.type, []);
            return Promise.map(listeners, (listener) => {
                return listener.listenerMethod(listener, data)
                    .catch((error) => this.logger.alert(logger_1.LogLevel.WARN, `Error thrown in handler queue processing:${error}`));
            }).return();
        };
        if (typeof data.server === 'number') {
            const port = data.server;
            this.expressApp = express();
            this.expressApp.use(bodyParser.json());
            this.expressApp.listen(port);
            this.logger.log(logger_1.LogLevel.INFO, `---> Created Express app on provided port ${port} for '${this.serviceName}'.`);
        }
        else if (data.server) {
            this.expressApp = data.server;
            this.logger.log(logger_1.LogLevel.INFO, `---> Using provided Express app for '${this.serviceName}'.`);
        }
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
                err: new ServiceScaffoldError(0, `No ${this.serviceName} context`),
                source: this.serviceName,
            });
        }
        return this.emitData(context)
            .then((response) => {
            return {
                response,
                source: this.serviceName,
            };
        })
            .catch((err) => {
            return {
                err,
                source: this.serviceName,
            };
        });
    }
    registerHandler(path, handler) {
        if (this.expressApp) {
            this.expressApp.post(`/${path}/`, handler);
        }
        else {
            throw new ServiceScaffoldError(1, 'Attempted to register a handler, but no express app configured.');
        }
    }
    get logger() {
        return this.loggerInstance;
    }
    get eventsRegistered() {
        return _.keys(this.eventListeners);
    }
}
exports.ServiceScaffold = ServiceScaffold;

//# sourceMappingURL=service-scaffold.js.map
