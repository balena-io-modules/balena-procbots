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

import TypedError = require('typed-error');
import * as Promise from 'bluebird';

/** An enumerated list of the things that might go wrong when seeking values from a DataHub */
export const enum DataHubErrorCode {
	ValueNotFound
}

export class DataHubError extends TypedError {
	public code: DataHubErrorCode;
	constructor(code: DataHubErrorCode, message: string) {
		super(message);
		this.code = code;
	}
}

/**
 * A definition for a service that allows the retrieval of user-set values,
 * including from possibly aynchronous contexts.
 */
export interface DataHub {
	/**
	 * Search for the specified value associated with a user, possibly from asynchronous contexts.
	 * @param user   The user who's data set we wish to search, eg sqweelygig.
	 * @param service The service for which we seek a value, eg discourse.
	 * @param key     The data we wish to search for, eg token.
	 * @returns       A promise that resolves to the value sought.  Asynchronous as it may be asking web services.
	 */
	fetchValue(user: string, service: string, key: string): Promise<string>;
}

/**
 * Retrieves and loads a DataHub by name.
 * @param name  The name of the DataHub to load.
 * @param data  The constructor object for the createDataHub method.
 * @return      The newly instantiated DataHub.
 */
export function createDataHub(name: string, data: any): DataHub {
	return require(`./${name}`).createDataHub(data);
}
