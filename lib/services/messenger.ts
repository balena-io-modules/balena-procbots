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
import * as _ from 'lodash';
import * as path from 'path';

import { LogLevel } from '../utils/logger';
import {
	EmitInstructions, MessengerConstructor,
	MessengerResponse, TranslatorDictionary, TransmitInformation,
} from './messenger-types';
import { createTranslator } from './messenger/translators/translator';
import { ServiceScaffold } from './service-scaffold';
import { ServiceScaffoldEvent } from './service-scaffold-types';
import {
	ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter,
	ServiceListener, ServiceRegistration, ServiceType,
} from './service-types';

/**
 * A service aggregator class that combines the interactions of several compatible
 * services and translates interactions with them into a communal object structure.
 */
export class MessengerService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
	private static _serviceName = path.basename(__filename.split('.')[0]);
	private translators: TranslatorDictionary;

	constructor(data: MessengerConstructor) {
		super(data);
		// Our super might have built a genuine express instance out of a port number
		data.server = this.expressApp;

		// This loop creates a set of translators for each sub-service this instance interacts with.
		this.translators = {};
		_.forEach(data.subServices, (subConnectionDetails, subServiceName) => {
			this.logger.log(LogLevel.INFO, `---> Constructing '${subServiceName}' translator.`);
			this.translators[subServiceName] = createTranslator(subServiceName, subConnectionDetails, data.metadataConfig);
		});

		// This branch creates listeners for every sub-service, if relevant.
		if (data.type === ServiceType.Listener) {
			_.forEach(data.subServices, (subConnectionDetails, subServiceName) => {
				this.logger.log(LogLevel.INFO, `---> Constructing '${subServiceName}' listener.`);
				const subTranslator = this.translators[subServiceName];
				subTranslator.mergeGenericDetails(subConnectionDetails, data);
				const subListener = require(`./${subServiceName}`).createServiceListener(subConnectionDetails);
				// This causes listeners to pass on any events they hear.
				subListener.registerEvent({
					events: subTranslator.getAllEventTypes(),
					listenerMethod: (_registration: ServiceRegistration, event: ServiceScaffoldEvent): Promise<void> => {
						// This translates and enqueues any events that match a registered interest.
						if (_.includes(this.eventsRegistered, subTranslator.eventIntoMessageType(event))) {
							return subTranslator.eventIntoMessages(event)
							.then((messages) => {
								_.forEach(messages, this.queueData);
							});
						}
						return Promise.resolve();
					},
					name: `${subServiceName}=>${this.serviceName}`,
				});
			});
		}
	}

	/**
	 * Emit a payload to the endpoint defined, resolving when done.
	 * @param data  details of the call and associated data
	 * @returns     A promise that resolves to the response
	 */
	protected emitData(data: TransmitInformation): Promise<MessengerResponse> {
		// Find details of how to connect and what to emit from the translators
		return Promise.props({
			connection: this.translators[data.target.service].messageIntoEmitterConstructor(data),
			emit: this.translators[data.target.service].messageIntoEmitDetails(data),
		})
		.then((details: { connection: object, emit: EmitInstructions } ) => {
			// Instantiates a one-shot emitter, because requests might have changing credentials.
			const emitter = require(`./${data.target.service}`).createServiceEmitter(details.connection);
			// This converts a method path, represented as an array of strings, eg ['comment', 'create']
			// into a method from a possibly nested SDK object, eg Front.comment.create
			const sdk = emitter.apiHandle[data.target.service];
			let method = sdk;
			_.forEach(details.emit.method, (nodeName) => {
				method = method[nodeName];
			});
			// Bundles the response and sends it on its way.
			const request: ServiceEmitRequest = {
				contexts: { [emitter.serviceName]: { method: method.bind(sdk), data: details.emit.payload } },
				source: this.serviceName,
			};
			return emitter.sendData(request);
		})
		// Translates any response from the sub-service emitter, before passing it on up.
		.then((response: ServiceEmitResponse) => {
			if (response.err) {
				return response;
			}
			return this.translators[data.target.service].responseIntoMessageResponse(data, response.response);
		});
	}

	/**
	 * Verify the event before enqueueing.
	 * @returns  true, this trusts that the sub-listener will have performed it's own verification.
	 */
	protected verify(): boolean {
		return true;
	}

	/**
	 * The name of this service, as required by the framework.
	 * @returns  'messenger' string.
	 */
	get serviceName(): string {
		return MessengerService._serviceName;
	}

	/**
	 * Retrieve the SDK API handle, if any.
	 * @returns  void
	 */
	get apiHandle(): void {
		return;
	}
}

/**
 * Build this class, typed and activated as a listener.
 * @returns  Service Listener object, awakened and ready to go.
 */
export function createServiceListener(data: MessengerConstructor): ServiceListener {
	return new MessengerService(data);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: MessengerConstructor): ServiceEmitter {
	return new MessengerService(data);
}
