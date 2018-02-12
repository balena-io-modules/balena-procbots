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
import * as FS from 'fs';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import { Dictionary } from 'lodash';
import { ServiceConstructor, ServiceEmitRequest, ServiceEmitter, ServiceFactory,
	ServiceListener, ServiceType } from '../services/service-types';
import { BuildCommand, ExecuteCommand } from '../utils/environment';
import { Logger } from '../utils/logger';
import { ConfigurationLocation, ProcBotConfiguration } from './procbot-types';
const fsReadFile = Promise.promisify(FS.readFile);

/**
 * The ServiceMap keeps information about all Services used by the Client.
 * It allows bots to give each Service an optional handle they can use
 */
interface ServiceMap<T> {
	/** The Service name. */
	name: string;
	/** The Service instance. */
	instance: T;
}

/**
 * The ProcBot class is a parent class that can be used for some top-level tasks:
 * * Schedule the processing of events clustered by a given context
 * * Support the addition of listeners or emitters by the child class, and dispatch events
 *   to emitters
 * * Retrieve configuration file from either the local FS or a ServiceEmitter
 */
export class ProcBot {
	/**
	 * A method that recursively dives down a nested structure,
	 * replacing values flagged <<INJECT_BLAH>> with values from process.env
	 * @param value  Nested structure to deep dive
	 * @returns      Identical structure with matching leaf elements replaced
	 */
	public static injectEnvironmentVariables(value: any): any {
		if (_.isArray(value)) {
			return _.map(value, ProcBot.injectEnvironmentVariables);
		}
		if (_.isObject(value)) {
			return _.mapValues(value, ProcBot.injectEnvironmentVariables);
		}
		if (_.isString(value)) {
			return ProcBot.stringInjector(value).cooked;
		}
		return value;
	}

	public static determineInjections(value: any): Dictionary<string> {
		if (_.isArray(value)) {
			const accumulator: Dictionary<string> = {};
			_.forEach(_.map(value, ProcBot.determineInjections), (injections) => {
				_.merge(accumulator, injections);
			});
			return accumulator;
		}
		if (_.isObject(value)) {
			const accumulator: Dictionary<string> = {};
			_.forEach(_.mapValues(value, ProcBot.determineInjections), (injections) => {
				_.merge(accumulator, injections);
			});
			return accumulator;
		}
		if (_.isString(value)) {
			return ProcBot.stringInjector(value).injections;
		}
		return {};
	}

	/**
	 * A method to inject values from env vars if required
	 * @param raw  String to translate, use <<INJECT_BLAH>> to retrieve BLAH
	 * @returns      Object of the cooked string and injections performed
	 */
	private static stringInjector(raw: string): { cooked: string, injections: Dictionary<string> } {
		const injections: Dictionary<string> = {};
		let cooked = raw;
		let match = /<<INJECT_(.*?)>>/g.exec(cooked);
		while (match) {
			const key = match[1];
			if (typeof process.env[key] === 'string') {
				injections[key] = process.env[key];
				cooked = cooked.replace(match[0], process.env[key]);
			} else {
				throw new Error(`${key} expected in environment variables, but not found.`);
			}
			match = /<<INJECT_(.*?)>>/g.exec(cooked);
		}
		return { cooked, injections };
	}

	/** The Client Bot name. */
	protected _botname: string;
	/** A logging instance for logging internal messages. */
	protected logger = new Logger();
	/** A map of ServiceListeners used by the Client Bot. */
	private listeners = new Map<string, ServiceMap<ServiceListener>>();
	/** A map of ServiceEmitters used by the Client Bot. */
	private emitters = new Map<string, ServiceMap<ServiceEmitter>>();

	constructor(name = 'ProcBot') {
		this._botname = name;
	}

	/**
	 * Retrieve the binary path for the Node dependencies.
	 * @returns Promise containing a string denoting the absolute path.
	 */
	public getNodeBinPath(): Promise<string> {
		return ExecuteCommand(BuildCommand('npm', [ 'bin' ])).then(_.trimEnd);
	}

	/**
	 * Process a configuration file from YAML into a nested object.
	 * @param configFile  The configuration file as a string.
	 * @returns           The configuration object or void.
	 */
	protected processConfiguration(configFile: string): ProcBotConfiguration | void {
		const config: ProcBotConfiguration = yaml.safeLoad(configFile);

		if (!config) {
			return;
		}

		// Swap out known tags that become booleans.
		const minimumVersion = _.get(config, 'procbot.minimum_version');
		if (minimumVersion && process.env.npm_package_version) {
			if (process.env.npm_package_version < minimumVersion) {
				throw new Error('Current ProcBot implementation does not meet minimum required version to run ');
			}
		}

		return config;
	}

	/**
	 * Retrieve a ProcBotConfiguration file from a ServiceEmitter or inbuilt route.
	 * @param details  An object detailing the service to retrieve the configuration file from, and its location.
	 * @returns        A Promise containing configuration object should one have been found, or void.
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
	 * Should the ServiceListener already exist on the client with the handle/name, this will do nothing.
	 *
	 * @param name   The name of the ServiceListener to add.
	 * @param data?  A ServiceConstructor extended constructor, should data be passed to a Service constructor.
	 * @returns      The constructed or pre-existing ServiceListener or void on failure.
	 */
	protected addServiceListener(name: string, data?: any): ServiceListener | void {
		return this.addService(ServiceType.Listener, name, data) as ServiceListener;
	}

	/**
	 * Add a new type of ServiceEmitter to the client.
	 * Should the ServiceEmitter already exist on the client with the handle/name, this will do nothing.
	 *
	 * @param name   The name of the ServiceEmitter to add.
	 * @param data?  A ServiceConstructor extended constructor, should data be passed to a Service constructor.
	 * @returns      The constructed or pre-existing ServiceEmitter or void on failure.
	 */
	protected addServiceEmitter(name: string, data?: any): ServiceEmitter | void {
		return this.addService(ServiceType.Emitter, name, data) as ServiceEmitter;
	}

	/**
	 * Find a particular attached ServiceListener based upon its handle.
	 *
	 * @param handle  Handle of the ServiceListener instance to find (name if no handle was set).
	 * @returns       Instance of the ServiceListener found, or void if not found.
	 */
	protected getListener(handle: string): ServiceListener | void {
		// Attempt to find the required ServiceListener. The handle's either the given
		// handle on construction or the name of a service if none were given.
		const listener = this.listeners.get(handle);
		return listener ? <ServiceListener>listener.instance : undefined;
	}

	/**
	 * Find a particular attached ServiceEmitter based upon its name.
	 *
	 * @param handle  Handle of the ServiceEmitter instance to find (name if no handle was set).
	 * @returns       Instance of the ServiceEmitter found, or void if not found.
	 */
	protected getEmitter(handle: string): ServiceEmitter | void {
		// Attempt to find the required ServiceEmitter. The handle's either the given
		// handle on construction or the name of a service if none were given.
		const emitter = this.emitters.get(handle);
		return emitter ? <ServiceEmitter>emitter.instance : undefined;
	}

	/**
	 * Dispatch to the specified emitter.
	 * This method exists as a shortcut to avoid having to retrieve a specific
	 * emitter before sending to it.
	 * @param data  The ServiceEmitRequest to use. This will be dispatched to all ServiceEmitters.
	 * @returns     An array of ServiceEmitResponses from all the ServiceEmitters.
	 */
	protected dispatchToAllEmitters(data: ServiceEmitRequest): Promise<any[]> {
		// If there's not a context for a particular emmiter, it will result in a response
		// with an error contained with in specifying as such. It is up to clients to determine
		// whether this is an issue or not
		return Promise.map(Array.from(this.emitters.values()), (entry) => {
			return entry.instance.sendData(data).catch((error) => error);
		});
	}

	/**
	 * Dispatch to a specific ServiceEmitter.
	 * This method exists as a shortcut to avoid having to retrieve a specific
	 * emitter before sending to it.
	 *
	 * @param handle  The handle of the ServiceEmitter to dispatch to.
	 * @param data    Emitter appropriate data to send.
	 * @returns       Data returned from the service represented by the ServiceEmitter.
	 * @throws        Any error returned from the service represented by the ServiceEmitter.
	 */
	protected dispatchToEmitter(handle: string, data: any): Promise<any> {
		// If emitter not found, this is an error
		let emitter = this.emitters.get(handle);
		let emitInstance = emitter ? <ServiceEmitter>emitter.instance : undefined;

		if (!emitter || !emitInstance) {
			throw new Error(`${name} emitter instance handle is not attached`);
		}

		// Create a new ServiceEmitRequest based on the data passed, the name of the service
		// to use and our name.
		const request: ServiceEmitRequest = {
			contexts: {},
			source: this._botname
		};
		request.contexts[emitter.name] = data;

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
	 * @returns     The relevant ServiceFactory for the service.
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

	/**
	 * Create a new ServiceListener or ServiceEmitter.
	 * Uses the passed name or handle as the indentifier for future creation/lookups.
	 * Should an instance with the handle (or name) already exist then this will be passed back.
	 *
	 * @param type  Type of Service to create.
	 * @param name  Name of the service to create.
	 * @param data  ServiceBase extended constructor, giving an optional handle and constructor data.
	 * @returns     A ServiceListener, ServiceEmitter or void value.
	 */
	private addService(type: ServiceType, name: string, data?: ServiceConstructor):
	ServiceListener | ServiceEmitter | void {
		// If there's no handle in the constructor data, the handle is the name.
		// We don't use the default in _.get() as TS doesn't infer the type correctly.
		let handle = _.get(data, 'handle') || name;

		// Attempt to retrieve the named service.
		const service = this.getService(name);
		const serviceMap = (type === ServiceType.Listener) ? this.listeners.get(handle) : this.emitters.get(handle);
		let instance: ServiceListener | ServiceEmitter | undefined;

		// If the service exists but the handle's not already registered, create a new instance.
		if (service && !serviceMap) {
			if (type === ServiceType.Listener) {
				instance = service.createServiceListener(data) as ServiceListener;
				this.listeners.set(handle, { name, instance });
			} else {
				instance = service.createServiceEmitter(data);
				this.emitters.set(handle, { name, instance });
			}
		} else if (serviceMap) {
			instance = serviceMap.instance;
		}

		return instance;
	}
}
