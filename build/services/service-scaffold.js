"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const bodyParser = require("body-parser");
const express = require("express");
const _ = require("lodash");
const procbot_1 = require("../framework/procbot");
const worker_1 = require("../framework/worker");
const worker_client_1 = require("../framework/worker-client");
const logger_1 = require("../utils/logger");
class ServiceScaffold extends worker_client_1.WorkerClient {
    constructor(expressApp) {
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
            const listeners = this.eventListeners[data.type] || [];
            return Promise.map(listeners, (listener) => {
                return listener.listenerMethod(listener, data);
            }).return();
        };
        this.instanceExpressApp = expressApp;
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
                err: new procbot_1.ProcBotError(0, `No ${this.serviceName} context`),
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
    get expressApp() {
        if (this.instanceExpressApp) {
            return this.instanceExpressApp;
        }
        if (!ServiceScaffold.singletonExpressApp) {
            const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
            if (!port) {
                throw new Error('No inbound port specified for express server.');
            }
            ServiceScaffold.singletonExpressApp = express();
            ServiceScaffold.singletonExpressApp.use(bodyParser.json());
            ServiceScaffold.singletonExpressApp.listen(port);
            this.logger.log(logger_1.LogLevel.INFO, `---> Started ServiceScaffold shared web server on port '${port}'.`);
        }
        return ServiceScaffold.singletonExpressApp;
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
