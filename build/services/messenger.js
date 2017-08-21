"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const path = require("path");
const logger_1 = require("../utils/logger");
const Translator = require("./messenger/translators/translator");
const service_scaffold_1 = require("./service-scaffold");
class MessengerService extends service_scaffold_1.ServiceScaffold {
    constructor(data, listen) {
        super();
        this.translators = {};
        _.forEach(data.subServices, (subConnectionDetails, serviceName) => {
            this.logger.log(logger_1.LogLevel.INFO, `---> Constructing '${serviceName}' translator.`);
            this.translators[serviceName] = Translator.createTranslator(serviceName, subConnectionDetails, data.dataHubs);
        });
        if (listen) {
            _.forEach(data.subServices, (subConnectionDetails, subServiceName) => {
                this.logger.log(logger_1.LogLevel.INFO, `---> Constructing '${subServiceName}' listener.`);
                const subListener = require(`./${subServiceName}`).createServiceListener(subConnectionDetails);
                subListener.registerEvent({
                    events: this.translators[subServiceName].getAllEventTypes(),
                    listenerMethod: (_registration, event) => {
                        if (_.includes(this.eventsRegistered, this.translators[subServiceName].eventIntoMessageType(event))) {
                            this.translators[subServiceName].eventIntoMessage(event)
                                .then((message) => {
                                this.logger.log(logger_1.LogLevel.INFO, `---> Heard '${message.cookedEvent.details.text}' on ${message.cookedEvent.source.service}.`);
                                this.queueData(message);
                            });
                        }
                    },
                    name: `${subServiceName}=>${this.serviceName}`,
                });
            });
        }
    }
    emitData(data) {
        return Promise.props({
            connection: this.translators[data.target.service].messageIntoConnectionDetails(data),
            emit: this.translators[data.target.service].messageIntoEmitDetails(data),
        }).then((details) => {
            const emitter = require(`./${data.target.service}`).createServiceEmitter(details.connection);
            const sdk = emitter.apiHandle[data.target.service];
            let method = sdk;
            _.forEach(details.emit.method, (nodeName) => {
                method = method[nodeName];
            });
            const request = {
                contexts: { [emitter.serviceName]: { method: method.bind(sdk), data: details.emit.payload } },
                source: this.serviceName,
            };
            return emitter.sendData(request);
        }).then((response) => {
            return this.translators[data.target.service].responseIntoMessageResponse(data, response.response);
        });
    }
    verify() {
        return true;
    }
    get serviceName() {
        return MessengerService._serviceName;
    }
    get apiHandle() {
        return;
    }
}
MessengerService._serviceName = path.basename(__filename.split('.')[0]);
exports.MessengerService = MessengerService;
function createServiceListener(data) {
    return new MessengerService(data, true);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new MessengerService(data, false);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=messenger.js.map
