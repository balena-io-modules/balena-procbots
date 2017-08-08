"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const path = require("path");
const Translator = require("../utils/translators/translator");
const service_utilities_1 = require("./service-utilities");
class MessengerService extends service_utilities_1.ServiceUtilities {
    constructor(data, listen) {
        super();
        this.connectionDetails = data.subServices;
        this.translators = {};
        _.forEach(data.subServices, (subConnectionDetails, serviceName) => {
            this.translators[serviceName] = Translator.createTranslator(serviceName, subConnectionDetails, data.dataHub);
        });
        if (listen) {
            this.startListening();
        }
    }
    emitData(data) {
        return Promise.props({
            connectionDetails: this.translators[data.target.service].messageIntoConnectionDetails(data),
            emitContext: this.translators[data.target.service].messageIntoEmitCreateMessage(data),
        }).then((details) => {
            const emitter = require(`./${data.target.service}`).createServiceEmitter(details.connectionDetails);
            return emitter.sendData({ contexts: { discourse: details.emitContext } });
        });
    }
    verify() {
        return true;
    }
    startListening() {
        _.forEach(this.connectionDetails, (subConnectionDetails, subServiceName) => {
            const subListener = require(`./${subServiceName}`).createServiceListener(subConnectionDetails);
            subListener.registerEvent({
                events: this.translators[subServiceName].getAllTriggers(),
                listenerMethod: (_registration, event) => {
                    this.translators[subServiceName].eventIntoMessage(event).then(this.queueData);
                },
                name: `${subServiceName}=>${this.serviceName}`,
            });
        });
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
