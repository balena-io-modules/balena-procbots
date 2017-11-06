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
import { Front } from 'front-sdk';
import * as path from 'path';

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
	private static _serviceName = path.basename(__filename.split('.')[0]);

	/** Underlying SDK object that we route requests to */
	private session: Front;

	constructor(data: FrontConstructor | FrontListenerConstructor) {
		super(data);
		this.session = new Front(data.token);
		if (data.type === ServiceType.Listener) {
			const listenerData = <FrontListenerConstructor>data;
			// This swallows webhook events.  When operating on an entire inbox we use its webhook rule,
			// but a webhook still requires somewhere to send its webhooks to.
			this.registerHandler('front-dev-null', (_formData, response) => {
				response.sendStatus(200);
			});
			// Create an endpoint for this listener, parse and enqueue events ...
			// ... remembering that serviceScaffold catches and logs errors.
			this.registerHandler(listenerData.path || FrontService._serviceName, (formData, response) => {
				const parsedEvent = JSON.parse(formData.body);
				this.queueData({
					context: parsedEvent.conversation.id,
					cookedEvent: parsedEvent,
					rawEvent: formData.body,
					source: FrontService._serviceName,
					type: parsedEvent.type,
				});
				response.sendStatus(200);
			});
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
		* Verify the event before enqueueing.  For now uses the naive approach of returning true.
		*/
	protected verify(_data: ServiceScaffoldEvent): boolean {
		// #204: This to be properly implemented.
		return true;
	}

	/**
	 * The name of this service, as required by the framework.
	 * @returns  'front' string.
	 */
	get serviceName(): string {
		return FrontService._serviceName;
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
export function createServiceListener(data: FrontListenerConstructor): ServiceListener {
	return new FrontService(data);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: FrontConstructor): ServiceEmitter {
	return new FrontService(data);
}
