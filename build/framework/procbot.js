"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const ChildProcess = require("child_process");
const FS = require("fs");
const yaml = require("js-yaml");
const _ = require("lodash");
const logger_1 = require("../utils/logger");
const fsReadFile = Promise.promisify(FS.readFile);
const exec = Promise.promisify(ChildProcess.exec);
class ProcBot {
    constructor(name = 'ProcBot') {
        this.logger = new logger_1.Logger();
        this.emitters = [];
        this.listeners = [];
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
    retrieveConfiguration(source, location) {
        let retrievePromise;
        if (source === 'fs') {
            retrievePromise = fsReadFile(location).call('toString');
        }
        else {
            retrievePromise = this.dispatchToEmitter(source, location);
        }
        return retrievePromise.then((contents) => {
            if (source === 'fs') {
                return this.processConfiguration(contents);
            }
            return contents;
        });
    }
    addServiceListener(name, data) {
        const service = this.getService(name);
        let listener;
        if (service && !_.find(this.listeners, ['serviceName', name])) {
            listener = service.createServiceListener(data);
            this.listeners.push(listener);
        }
        return listener;
    }
    addServiceEmitter(name, data) {
        const service = this.getService(name);
        let emitter;
        if (service && !_.find(this.emitters, ['serviceName', name])) {
            emitter = service.createServiceEmitter(data);
            this.emitters.push(emitter);
        }
        return emitter;
    }
    getListener(name) {
        return _.find(this.listeners, (listener) => listener.serviceName === name);
    }
    getEmitter(name) {
        return _.find(this.emitters, (emitter) => emitter.serviceName === name);
    }
    dispatchToAllEmitters(data) {
        let results = [];
        return Promise.map(this.emitters, (emitter) => {
            return emitter.sendData(data)
                .then((result) => { results.push(result); })
                .catch((error) => { results.push(error); });
        }).return(results);
    }
    dispatchToEmitter(name, data) {
        const emitInstance = _.find(this.emitters, (emitter) => emitter.serviceName === name);
        if (!emitInstance) {
            throw new Error(`${name} emitter is not attached`);
        }
        const request = {
            contexts: {},
            source: this._botname
        };
        request.contexts[name] = data;
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
}
exports.ProcBot = ProcBot;

//# sourceMappingURL=procbot.js.map
