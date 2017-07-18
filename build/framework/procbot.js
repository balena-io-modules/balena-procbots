"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const ChildProcess = require("child_process");
const FS = require("fs");
const yaml = require("js-yaml");
const logger_1 = require("../utils/logger");
const fsReadFile = Promise.promisify(FS.readFile);
const exec = Promise.promisify(ChildProcess.exec);
class ProcBot {
    constructor(name = 'ProcBot') {
        this.logger = new logger_1.Logger();
        this.listeners = new Map();
        this.emitters = new Map();
        this._botname = name;
    }
    getNodeBinPath() {
        if (this.nodeBinPath) {
            return Promise.resolve(this.nodeBinPath);
        }
        return exec('npm bin').then((binPath) => {
            this.nodeBinPath = binPath.trim();
            return this.nodeBinPath;
        });
    }
    processConfiguration(configFile) {
        const config = yaml.safeLoad(configFile);
        if (!config) {
            return;
        }
        const minimumVersion = ((config || {}).procbot || {}).minimum_version;
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
        return this.addService('listener', name, data);
    }
    addServiceEmitter(name, data) {
        return this.addService('emitter', name, data);
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
        let results = [];
        let emitterPromises = [];
        this.emitters.forEach((emitterEntry) => {
            const emitter = emitterEntry.instance;
            const promise = emitter.sendData(data)
                .then((result) => { results.push(result); })
                .catch((error) => { results.push(error); });
            emitterPromises.push(promise);
        });
        return Promise.all(emitterPromises).return(results);
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
        let handle = data ? data.handle : name;
        if (!handle) {
            handle = name;
        }
        const service = this.getService(name);
        let serviceMap = (type === 'listener') ? this.listeners.get(handle) :
            this.emitters.get(handle);
        let serviceInstance;
        if (service && !serviceMap) {
            let serviceEntries;
            if (type === 'listener') {
                serviceEntries = this.listeners;
                serviceInstance = service.createServiceListener(data);
            }
            else {
                serviceEntries = this.emitters;
                serviceInstance = service.createServiceEmitter(data);
            }
            serviceEntries.set(handle, {
                name,
                instance: serviceInstance
            });
        }
        return serviceInstance;
    }
}
exports.ProcBot = ProcBot;

//# sourceMappingURL=procbot.js.map
