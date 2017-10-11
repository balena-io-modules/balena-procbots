"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const path = require("path");
const logger_1 = require("../utils/logger");
const translator_1 = require("./messenger/translators/translator");
const service_scaffold_1 = require("./service-scaffold");
class MessengerService extends service_scaffold_1.ServiceScaffold {
    constructor(data) {
        super(data);
        data.server = this.expressApp;
        this.translators = {};
        _.forEach(data.subServices, (subConnectionDetails, subServiceName) => {
            this.logger.log(logger_1.LogLevel.INFO, `---> Constructing '${subServiceName}' translator.`);
            this.translators[subServiceName] = translator_1.createTranslator(subServiceName, subConnectionDetails, data.dataHubs);
        });
        if (data.type === 0) {
            _.forEach(data.subServices, (subConnectionDetails, subServiceName) => {
                this.logger.log(logger_1.LogLevel.INFO, `---> Constructing '${subServiceName}' listener.`);
                const subTranslator = this.translators[subServiceName];
                subTranslator.mergeGenericDetails(subConnectionDetails, data);
                const subListener = require(`./${subServiceName}`).createServiceListener(subConnectionDetails);
                subListener.registerEvent({
                    events: subTranslator.getAllEventTypes(),
                    listenerMethod: (_registration, event) => {
                        if (_.includes(this.eventsRegistered, subTranslator.eventIntoMessageType(event))) {
                            return subTranslator.eventIntoMessage(event)
                                .then(this.queueData);
                        }
                        return Promise.resolve();
                    },
                    name: `${subServiceName}=>${this.serviceName}`,
                });
            });
        }
    }
    emitData(data) {
        return Promise.props({
            connection: this.translators[data.target.service].messageIntoEmitterConstructor(data),
            emit: this.translators[data.target.service].messageIntoEmitDetails(data),
        })
            .then((details) => {
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
        })
            .then((response) => {
            if (response.err) {
                return response;
            }
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
    return new MessengerService(data);
}
exports.createServiceListener = createServiceListener;
function createServiceEmitter(data) {
    return new MessengerService(data);
}
exports.createServiceEmitter = createServiceEmitter;

//# sourceMappingURL=messenger.js.map
