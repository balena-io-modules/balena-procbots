/*
Copyright 2016-2017 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import * as Promise from 'bluebird';
import * as ChildProcess from 'child_process';
import * as FS from 'fs';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceFactory,
    ServiceListener } from '../services/service-types';
import { Logger } from '../utils/logger';
import { ConfigurationLocation, ProcBotConfiguration } from './procbot-types';
const fsReadFile = Promise.promisify(FS.readFile);
const exec: (command: string, options?: any) => Promise<{}> = Promise.promisify(ChildProcess.exec);

/**
 * The ProcBot class is a parent class that can be used for some top-level tasks:
 * * Schedule the processing of events clustered by a given context
 * * Support the addition of listeners or emitters by the child class, and dispatch events
 *   to emitters
 * * Retrieve configuration file from either the local FS or a ServiceEmitter
 */
export class ProcBot {
    protected _botname: string;
    protected logger = new Logger();
    private emitters: ServiceEmitter[] = [];
    private listeners: ServiceListener[] = [];
    private nodeBinPath: string;

    constructor(name = 'ProcBot') {
        this._botname = name;
    }

    /**
     * Retrieve the binary path for the Node dependencies.
     * @return  A string containing the absolute path.
     */
    public getNodeBinPath(): Promise<string> {
        if (this.nodeBinPath) {
            return Promise.resolve(this.nodeBinPath);
        }

        return exec('npm bin').then((binPath: string) => {
            this.nodeBinPath = binPath.trim();
            return this.nodeBinPath;
        });
    }

    /**
     * Process a configuration file from YAML into a nested object.
     * @param configFile    The configuration file as a string.
     * @return              The configuration object or void.
     */
    protected processConfiguration(configFile: string): ProcBotConfiguration | void {
        const config: ProcBotConfiguration = yaml.safeLoad(configFile);

        if (!config) {
            return;
        }

        // Swap out known tags that become booleans.
        const minimumVersion = ((config || {}).procbot || {}).minimum_version;
        if (minimumVersion && process.env.npm_package_version) {
            if (process.env.npm_package_version < minimumVersion) {
                throw new Error('Current ProcBot implementation does not meet minimum required version to run ');
            }
        }

        return config;
    }

    /**
     * Retrieve a ProcBotConfiguration file from a ServiceEmitter or inbuilt route.
     * @param details   An object detailing the service to retrieve the configuration file from, and its location.
     * @return          A Promise containing configuration object should one have been found, or void.
     */
    protected retrieveConfiguration(details: ConfigurationLocation): Promise<ProcBotConfiguration | void> {
        let retrievePromise: Promise<string | void>;
        if (typeof details.emitter === 'string') {
            retrievePromise = fsReadFile(details.location).call('toString');
        } else {
            if (details.emitter.getConfigurationFile) {
                retrievePromise = details.emitter.getConfigurationFile(details);
            } else {
                return Promise.resolve();
            }
        }

        return retrievePromise.then((configFile: string | void) => {
            if (configFile) {
                return this.processConfiguration(configFile);
            }
        });
    }

    /**
     * Add a new type of ServiceListener to the client.
     * Should the ServiceListener already exist on the client, this will do nothing.
     * @param name  The name of the ServiceListener to add.
     * @param data? Any relevant data required to construct the ServiceListener.
     * @return      The constructed ServiceListener or void should it already exist or fail.
     */
    protected addServiceListener(name: string, data?: any): ServiceListener | void {
        const service = this.getService(name);
        let listener;

        if (service && !_.find(this.listeners, [ 'serviceName', name ])) {
            listener = service.createServiceListener(data);
            this.listeners.push(listener);
        }

        return listener;
    }

    /**
     * Add a new type of ServiceEmitter to the client.
     * Should the ServiceEmitter already exist on the client, this will do nothing.
     * @param name  The name of the ServiceEmitter to add.
     * @param data? Any relevant data required to construct the ServiceEmitter.
     * @return      The constructed ServiceEmitter or void should it already exist or fail.
     */
    protected addServiceEmitter(name: string, data?: any): ServiceEmitter | void {
        const service = this.getService(name);
        let emitter;

        if (service && !_.find(this.emitters, [ 'serviceName', name ])) {
            emitter = service.createServiceEmitter(data);
            this.emitters.push(emitter);
        }

        return emitter;
    }

    /**
     * Find a particular attached ServiceListener based upon its name.
     * @param name  Name of the ServiceListener instance to find.
     * @return      Instance of the ServiceListener found, or void if not found.
     */
    protected getListener(name: string): ServiceListener | void {
        return _.find(this.listeners, (listener) => listener.serviceName === name);
    }

    /**
     * Find a particular attached ServiceEmitter based upon its name.
     * @param name  Name of the ServiceEmitter instance to find.
     * @return      Instance of the ServiceEmitter found, or void if not found.
     */
    protected getEmitter(name: string): ServiceEmitter | void {
        return _.find(this.emitters, (emitter) => emitter.serviceName === name);
    }

    // Returns a promise containing the results of all final send statuses.
    /**
     * Dispatch to the specified emitter.
     * This method exists as a shortcut to avoid having to retrieve a specific
     * emitter before sending to it.
     * @param data  The ServiceEmitRequest to use. This will be dispatched to all ServiceEmitters.
     * @return      An array of ServiceEmitResponses from all the ServiceEmitters.
     */
    protected dispatchToAllEmitters(data: ServiceEmitRequest): Promise<ServiceEmitResponse[]> {
        let results: ServiceEmitResponse[] = [];

        // If there's not a context for a particular emmiter, it will result in a response
        // with an error contained with in specifying as such. It is up to clients to determine
        // whether this is an issue or not
        return Promise.map(this.emitters, (emitter) => {
            return emitter.sendData(data)
            .then((result) => { results.push(result); })
            .catch((error) => { results.push(error); });
        }).return(results);
    }

    /**
     * Dispatch to a specific ServiceEmitter.
     * This method exists as a shortcut to avoid having to retrieve a specific
     * emitter before sending to it.
     * @param name  The name of the ServiceEmitter to dispatch to.
     * @param data  Emitter appropriate data to send.
     * @return      Data returned from the service represented by the ServiceEmitter.
     * @throws      Any error returned from the service represented by the ServiceEmitter.
     */
    protected dispatchToEmitter(name: string, data: any): Promise<any> {
        // If emitter not found, this is an error
        const emitInstance = _.find(this.emitters, (emitter) => emitter.serviceName === name);

        if (!emitInstance) {
            throw new Error(`${name} emitter is not attached`);
        }

        // Create a new ServiceEmitRequest based on the data passed, the name of the service
        // to use and our name.
        const request: ServiceEmitRequest = {
            contexts: {},
            source: this._botname
        };
        request.contexts[name] = data;

        return emitInstance.sendData(request).then((result) => {
            // If an error occured, throw it.
            if (result.err) {
                throw result.err;
            }

            return result.response;
        });
    }

    /**
     * Retrieves and loads a ServiceListener or ServiceEmitter by name.
     * @param name  The name of the ServiceListener or ServiceEmitter to load.
     * @return      The relevant ServiceFactory for the service.
     */
    private getService(name: string): ServiceFactory {
        // Actually what we could do is just do a require, where the Service
        // exports a newly made object. We know that this always has a
        // `registerAction`, so that's all we care about.
        const service: ServiceFactory = require(`../services/${name}`);
        if (!service) {
            throw new Error(`Couldn't find Service: ${name}`);
        }

        return service;
    }
}
