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

import { createDataHub, DataHub } from '../utils/datahubs/datahub';
import { createTranslator, Translator } from '../utils/translators/translator';
import { MessengerConnectionDetails, TransmitContext } from './messenger-types';
import {
	ServiceEmitContext, ServiceEmitResponse,
	ServiceEmitter, ServiceEvent,
	ServiceListener, ServiceRegistration,
} from './service-types';
import { ServiceUtilities } from './service-utilities';

export class MessengerService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
	private static _serviceName = path.basename(__filename.split('.')[0]);
	private translators: { [service: string]: Translator } = {};
	private hub: DataHub;
	private connectionDetails: MessengerConnectionDetails;

	/**
	 * Connect to the service, used as part of construction.
	 * @param data  Object containing the required details for the service.
	 */
	protected connect(data: MessengerConnectionDetails): void {
		this.connectionDetails = data;
		_.map(data, (subConnectionDetails, serviceName) => {
			this.translators[serviceName] = createTranslator(serviceName, subConnectionDetails);
		});
		// TODO: It is not the place of messenger to understand data hub?
		this.hub = createDataHub(process.env.SYNCBOT_HUB_SERVICE, data[process.env.SYNCBOT_HUB_SERVICE]);
	}

	protected emitData(data: TransmitContext): Promise<ServiceEmitResponse> {
		const valueFetcher = _.partial(this.hub.fetchValue, data.toIds.user);
		const genericValues = this.connectionDetails[data.to];
		const translator = this.translators[data.to];
		return Promise.props({
			data: translator.messageIntoEmitCreateMessage(data),
			emitter: translator.makeEmitter(valueFetcher, genericValues),
		})
		.then((details: {emitter: ServiceEmitter, data: ServiceEmitContext}) => {
			// TODO: Source???
			return details.emitter.sendData({ contexts: {[data.to]: details.data}, source: 'messenger'});
		});
	}

	protected startListening(): void {
		_.map(this.connectionDetails, (subConnectionDetails, subServiceName) => {
			const subListener = require(`./${subServiceName}`).createListener(subConnectionDetails);
			subListener.registerEvent({
				// TODO: This is potentially noisy.  It is translating every event it can, including ones it might ...
				// ... not care about.  Which isn't so bad, except some translations require API calls.
				events: this.translators[subServiceName].getAllTriggers(),
				listenerMethod: (_registration: ServiceRegistration, event: ServiceEvent) => {
					this.translators[subServiceName].eventIntoMessage(event).then(this.queueData);
				},
				name: `${subServiceName}=>${this.serviceName}`,
			});
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
