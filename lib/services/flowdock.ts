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
import { Session } from 'flowdock';
import * as path from 'path';
import {
	FlowdockConnectionDetails, FlowdockEmitContext,
	FlowdockHandle, FlowdockResponse
} from './flowdock-types';
import { ServiceScaffold } from './service-scaffold';
import { ServiceEmitter, ServiceListener } from './service-types';

export class FlowdockService extends ServiceScaffold<string> implements ServiceEmitter, ServiceListener {
	private static _serviceName = path.basename(__filename.split('.')[0]);
	private session: Session;
	private org: string;

	constructor(data: FlowdockConnectionDetails) {
		super();
		this.session = new Session(data.token);
		// The flowdock service both emits and calls back the error
		// We'll specifically ignore the emit to prevent it bubbling
		const doNothing = () => { /* pass */ };
		this.session.on('error', doNothing);
		this.org = data.organization;
		if (!data.deaf) {
			// Get a list of known flows from the session
			this.session.flows((error: any, flows: any) => {
				if (error) {
					throw error;
				}
				// Enclose a list of flow names
				const flowIdToFlowName: {[key: string]: string} = {};
				for (const flow of flows) {
					flowIdToFlowName[flow.id] = flow.parameterized_name;
				}
				const stream = this.session.stream(Object.keys(flowIdToFlowName));
				stream.on('message', (message: any) => {
					this.queueData({
						context: message.thread_id,
						cookedEvent: {
							flow: flowIdToFlowName[message.flow],
						},
						type: message.event,
						rawEvent: message,
						source: FlowdockService._serviceName,
					});
				});
			});
			// Create a keep-alive endpoint for contexts that sleep between web requests
			this.expressApp.get(`/${FlowdockService._serviceName}/`, (_formData, response) => {
				response.sendStatus(200);
			});
		}
	}

	protected emitData(context: FlowdockEmitContext): Promise<FlowdockResponse> {
		return new Promise<FlowdockResponse>((resolve, reject) => {
			context.method(
				context.data.path, context.data.payload,
				(error: Error, response: FlowdockResponse) => {
					if (error) {
						reject(error);
					} else {
						resolve(response);
					}
				}
			);
		});
	}

	/**
		* Verify the event before enqueueing. Since we connect to a web stream we can assume events are legitimate.
		*/
	protected verify(): boolean {
		return true;
	}

	/**
	 * Get the service name, as required by the framework.
	 * @returns  The specific service name for Flowdock.
	 */
	get serviceName(): string {
		return FlowdockService._serviceName;
	}

	/**
	 * Retrieve the SDK API handle for Flowdock.
	 * @returns  The Flowdock SDK API handle.
	 */
	get apiHandle(): FlowdockHandle {
		return {
			flowdock: this.session
		};
	}
}

/**
 * Build this class, typed and activated as a listener.
 * @returns  Service Listener object, awakened and ready to go.
 */
export function createServiceListener(data: FlowdockConnectionDetails): ServiceListener {
	data.deaf = false;
	return new FlowdockService(data);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: FlowdockConnectionDetails): ServiceEmitter {
	data.deaf = true;
	return new FlowdockService(data);
}
