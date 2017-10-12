"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const FS = require("fs");
const yaml = require("js-yaml");
const _ = require("lodash");
const environment_1 = require("../utils/environment");
const logger_1 = require("../utils/logger");
const fsReadFile = Promise.promisify(FS.readFile);
class ProcBot {
    constructor(name = 'ProcBot') {
        this.logger = new logger_1.Logger();
        this.listeners = new Map();
        this.emitters = new Map();
        this._botname = name;
    }
    getNodeBinPath() {
        return environment_1.ExecuteCommand(environment_1.BuildCommand('npm', ['bin'])).then(_.trimEnd);
    }
    processConfiguration(configFile) {
        const config = yaml.safeLoad(configFile);
        if (!config) {
            return;
        }
        const minimumVersion = _.get(config, 'procbot.minimum_version');
        if (minimumVersion && process.env.npm_package_version) {
            if (process.env.npm_package_version < minimumVersion) {
                throw new Error('Current ProcBot implementation does not meet minimum required version to run ');
            }
        }
        return config;
    }
    retrieveConfiguration(details) {
        let retrievePromise;
        if (typeof details.emitter === 'string') {
            retrievePromise = fsReadFile(details.location).call('toString');
        }
        else {
            if (details.emitter.getConfigurationFile) {
                retrievePromise = details.emitter.getConfigurationFile(details);
            }
            else {
                return Promise.resolve();
            }
        }
        return retrievePromise.then((configFile) => {
            if (configFile) {
                return this.processConfiguration(configFile);
            }
        });
    }
    addServiceListener(name, data) {
        return this.addService(0, name, data);
    }
    addServiceEmitter(name, data) {
        return this.addService(1, name, data);
    }
    getListener(handle) {
        const listener = this.listeners.get(handle);
        return listener ? listener.instance : undefined;
    }
    getEmitter(handle) {
        const emitter = this.emitters.get(handle);
        return emitter ? emitter.instance : undefined;
    }
    dispatchToAllEmitters(data) {
        return Promise.map(Array.from(this.emitters.values()), (entry) => {
            return entry.instance.sendData(data).catch((error) => error);
        });
    }
    dispatchToEmitter(handle, data) {
        let emitter = this.emitters.get(handle);
        let emitInstance = emitter ? emitter.instance : undefined;
        if (!emitter || !emitInstance) {
            throw new Error(`${name} emitter instance handle is not attached`);
        }
        const request = {
            contexts: {},
            source: this._botname
        };
        request.contexts[emitter.name] = data;
        return emitInstance.sendData(request).then((result) => {
            if (result.err) {
                throw result.err;
            }
            return result.response;
        });
    }
    getService(name) {
        const service = require(`../services/${name}`);
        if (!service) {
            throw new Error(`Couldn't find Service: ${name}`);
        }
        return service;
    }
    addService(type, name, data) {
        let handle = _.get(data, 'handle', name);
        const service = this.getService(name);
        const serviceMap = (type === 0) ? this.listeners.get(handle) : this.emitters.get(handle);
        let instance;
        if (service && !serviceMap) {
            if (type === 0) {
                instance = service.createServiceListener(data);
                this.listeners.set(handle, { name, instance });
            }
            else {
                instance = service.createServiceEmitter(data);
                this.emitters.set(handle, { name, instance });
            }
        }
        else if (serviceMap) {
            instance = serviceMap.instance;
        }
        return instance;
    }
}
exports.ProcBot = ProcBot;

//# sourceMappingURL=procbot.js.map
