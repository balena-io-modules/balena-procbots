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
	MessageResponseData, MessengerConstructionDetails, TransmitContext
} from './messenger-types';
import * as Translator from './messenger/translators/translator';
import { ServiceScaffold } from './service-scaffold';
import { ServiceScaffoldServiceEvent } from './service-scaffold-types';
import {
	ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse,
	ServiceEmitter,
	ServiceListener, ServiceRegistration,
} from './service-types';

export class MessengerService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
	private static _serviceName = path.basename(__filename.split('.')[0]);
	private translators: { [service: string]: Translator.Translator };

	constructor(data: MessengerConstructionDetails, listen: boolean) {
		super();
		this.translators = {};
		_.forEach(data.subServices, (subConnectionDetails, serviceName) => {
			this.logger.log(LogLevel.INFO, `---> Constructing '${serviceName}' translator.`);
			this.translators[serviceName] = Translator.createTranslator(serviceName, subConnectionDetails, data.dataHubs);
		});
		if (listen) {
			_.forEach(data.subServices, (subConnectionDetails, subServiceName) => {
				this.logger.log(LogLevel.INFO, `---> Constructing '${subServiceName}' listener.`);
				const subListener = require(`./${subServiceName}`).createServiceListener(subConnectionDetails);
				subListener.registerEvent({
					events: this.translators[subServiceName].getAllEventTypes(),
					listenerMethod: (_registration: ServiceRegistration, event: ServiceScaffoldServiceEvent) => {
						if (_.includes(this.eventsRegistered, this.translators[subServiceName].eventIntoMessageType(event))) {
							this.translators[subServiceName].eventIntoMessage(event)
								.then((message) => {
									this.logger.log(
										LogLevel.INFO, `---> Heard '${message.cookedEvent.details.text}' on ${message.cookedEvent.source.service}.`
									);
									this.queueData(message);
								});
						}
					},
					name: `${subServiceName}=>${this.serviceName}`,
				});
			});
		}
	}

	protected emitData(data: TransmitContext): Promise<MessageResponseData> {
		return Promise.props({
			connection: this.translators[data.target.service].messageIntoConnectionDetails(data),
			emit: this.translators[data.target.service].messageIntoEmitDetails(data),
		}).then((details: { connection: object, emit: { payload: ServiceEmitContext, method: string[] } } ) => {
			const emitter = require(`./${data.target.service}`).createServiceEmitter(details.connection);
			const sdk = emitter.apiHandle[data.target.service];
			let method = sdk;
			_.forEach(details.emit.method, (nodeName) => {
				method = method[nodeName];
			});
			const request: ServiceEmitRequest = {
				contexts: { [emitter.serviceName]: { method: method.bind(sdk), data: details.emit.payload } },
				source: this.serviceName,
			};
			return emitter.sendData(request);
		}).then((response: ServiceEmitResponse) => {
			return this.translators[data.target.service].responseIntoMessageResponse(data, response.response);
		});
	}

	/**
		* Verify the event before enqueueing.  Trusts that the sub-listener will have performed it's own verification.
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
	 * @return  void
	 */
	get apiHandle(): void {
		return;
	}
}

/**
 * Build this class, typed and activated as a listener.
 * @returns  Service Listener object, awakened and ready to go.
 */
export function createServiceListener(data: MessengerConstructionDetails): ServiceListener {
	return new MessengerService(data, true);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: MessengerConstructionDetails): ServiceEmitter {
	return new MessengerService(data, false);
}
