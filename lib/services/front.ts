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
import { Event, Front } from 'front-sdk';

import { Logger, LogLevel } from '../utils/logger';
import {
	FrontConstructor, FrontEmitContext,
	FrontHandle, FrontListenerConstructor, FrontResponse,
} from './front-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceScaffoldEvent } from './service-scaffold-types';
import { ServiceEmitter, ServiceListener, ServiceType } from './service-types';

/**
 * A service for interacting with the Front API via the Front SDK
 */
export class FrontService extends ServiceScaffold<string> implements ServiceListener, ServiceEmitter {
	/** Underlying SDK object that we route requests to */
	private session: Front;

	constructor(data: FrontConstructor | FrontListenerConstructor, logger: Logger) {
		super(data, logger);
		if (data.type === ServiceType.Listener) {
			const listenerData = <FrontListenerConstructor>data;
			this.session = new Front(listenerData.token, listenerData.secret);
			// This swallows webhook events associated with a channel.
			// When operating on an entire inbox we use its webhook rule,
			// but a channel still requires somewhere to send its webhooks to.
			this.registerHandler('front-dev-null', (_formData, response) => {
				response.sendStatus(200);
			});
			const path = listenerData.path || this.serviceName;
			this.session.registerEvents({
				hookPath: `/${path}`,
				server: this.expressApp,
			}, (error: Error | null, event?: Event) => {
				if (!error && event) {
					this.queueData({
						context: event.conversation.id,
						cookedEvent: {},
						rawEvent: event,
						source: this.serviceName,
						type: event.type,
					});
				}
				if (error) {
					this.logger.log(LogLevel.WARN, error.message);
				}
			});
			this.logger.log(
				LogLevel.INFO,
				`---> Added endpoint '/${path}' for '${this.serviceName}'.`
			);
		} else {
			this.session = new Front(data.token);
		}
	}

	/**
	 * Actually emit the data to the SDK.
	 * Extracting the context will have been done by the serviceScaffold.
	 * @param context  Context to be emitted
	 * @returns        Promise that resolves to the SDK response
	 */
	protected emitData(context: FrontEmitContext): Promise<FrontResponse> {
		return context.method(context.data);
	}

	/**
	 * Verify the event before enqueueing. Trusts the SDK to perform verification.
	 */
	protected verify(_data: ServiceScaffoldEvent): boolean {
		// The Front SDK verifies events as it receives them.
		return true;
	}

	/**
	 * Retrieve the SDK API handle for Front.
	 * @return  The Front SDK API handle.
	 */
	get apiHandle(): FrontHandle {
		return {
			front: this.session
		};
	}
}

/**
 * Build this class, typed and activated as a listener.
 * @returns  Service Listener object, awakened and ready to go.
 */
export function createServiceListener(data: FrontListenerConstructor, logger: Logger): ServiceListener {
	return new FrontService(data, logger);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: FrontConstructor, logger: Logger): ServiceEmitter {
	return new FrontService(data, logger);
}
