"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const Translator = require("../utils/translators/translator");
const service_utilities_1 = require("./service-utilities");
class MessengerService extends service_utilities_1.ServiceUtilities {
    connect(data) {
        this.connectionDetails = data.subServices;
        this.translators = {};
        _.map(data.subServices, (subConnectionDetails, serviceName) => {
            this.translators[serviceName] = Translator.createTranslator(serviceName, subConnectionDetails, data.dataHub);
        });
    }
    emitData(_data) {
        throw new Error('Not supported');
    }
    startListening() {
        _.map(this.connectionDetails, (subConnectionDetails, subServiceName) => {
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
