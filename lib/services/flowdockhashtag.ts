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

import { Session } from 'flowdock';
import { Logger } from '../utils/logger';
import { FlowdockService } from './flowdock';
import { FlowdockConstructor, FlowdockHandle } from './flowdock-types';
import { ServiceEmitter, ServiceListener } from './service-types';

/** The Flowdock-ish API SDK handle type. */
export interface HashtagHandle extends FlowdockHandle {
	flowdockhashtag: Session;
}

/**
 * A service for interacting with Flowdock via their SDK
 */
export class FlowdockHashtagService extends FlowdockService implements ServiceEmitter, ServiceListener {
	constructor(data: FlowdockConstructor, logger: Logger) {
		super(data, logger);
	}

	/**
	 * Retrieve the SDK API handle for Flowdock-ish.
	 * @returns  The Flowdock-ish SDK API handle.
	 */
	get apiHandle(): HashtagHandle {
		const handle = super.apiHandle.flowdock;
		return {
			flowdock: handle,
			flowdockhashtag: handle,
		};
	}
}

/**
 * Build this class, typed and activated as a listener.
 * @returns  Service Listener object, awakened and ready to go.
 */
export function createServiceListener(data: FlowdockConstructor, logger: Logger): ServiceListener {
	return new FlowdockHashtagService(data, logger);
}

/**
 * Build this class, typed as an emitter.
 * @returns  Service Emitter object, ready for your events.
 */
export function createServiceEmitter(data: FlowdockConstructor, logger: Logger): ServiceEmitter {
	return new FlowdockHashtagService(data, logger);
}
