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
import * as path from 'path';

import { ServiceEmitContext, ServiceEmitter, ServiceListener } from './service-types';
import { ServiceUtilities } from './service-utilities';
import { UtilityServiceEvent } from './service-utilities-types';

export class MessengerService extends ServiceUtilities implements ServiceListener, ServiceEmitter {
	private static _serviceName = path.basename(__filename.split('.')[0]);

	protected connect(_data: any): void {
		throw new Error();
	}

	protected emitData(_data: ServiceEmitContext): Promise<any> {
		throw new Error();
	}

	protected startListening(): void {
		throw new Error();
	}

	protected verify(_data: UtilityServiceEvent): boolean {
		throw new Error();
	}

	/**
	 * The name of this service, as required by the framework.
	 * @returns  'front' string.
	 */
	get serviceName(): string {
		return MessengerService._serviceName;
	}

	/**
	 * Retrieve the SDK API handle for Front.
	 * @return  The Front SDK API handle.
	 */
	get apiHandle(): void {
		return;
	}
}
