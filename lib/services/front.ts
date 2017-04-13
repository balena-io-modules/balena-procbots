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
	FrontConnectionDetails, FrontEmitContext,
	FrontEvent, FrontHandle, FrontResponse,
} from './front-types';
import { ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';

export class FrontService extends ServiceUtilities<string> implements ServiceListener, ServiceEmitter {
	private static _serviceName = path.basename(__filename.split('.')[0]);

	/** Underlying SDK object that we route requests to */
	private session: Front;

	constructor(data: FrontConnectionDetails, listen: boolean) {
		super();
		this.session = new Front(data.token);
		if (listen) {
			// This swallows webhook events.  When operating on an entire inbox we use its webhook rule, but a webhook
			// channel still requires somewhere to send its webhooks to.
			this.expressApp.post('/front-dev-null', (_formData, response) => {
				response.sendStatus(200);
			});
			// Create an endpoint for this listener and enqueue events
			this.expressApp.post(`/${FrontService._serviceName}/`, (formData, response) => {
				this.queueData({
					context: formData.body.conversation.id,
					event: formData.body.type,
					cookedEvent: {},
					rawEvent: formData.body,
					source: FrontService._serviceName,
				});
				response.sendStatus(200);
			});
		}
	}

	/**
	 * Return a method that will: emit RequestData to the service, resolving to ResponseData
	 * @param context  Context to be emitted
	 */
	protected emitData(context: FrontEmitContext): Promise<FrontResponse> {
		return context.method(context.data);
	}

	/**
		* Verify the event before enqueueing.  For now uses the naive approach of returning true.
		*/
	protected verify(_data: FrontEvent): boolean {
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
export function createServiceListener(data: FrontConnectionDetails): ServiceListener {
	return new FrontService(data, true);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: FrontConnectionDetails): ServiceEmitter {
	return new FrontService(data, false);
}
