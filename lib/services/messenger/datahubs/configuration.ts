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
import { DataHub, DataHubError, DataHubErrorCode } from './datahub';

/**
 * A service retrieves values from the environment
 */
export class ConfigurationDataHub implements DataHub {
	/** First word, used as namespace, of the environment variables to surface. */
	private prefix: string;

	constructor(prefix: string) {
		this.prefix = prefix;
	}

	/**
	 * Search for the specified value associated with a user, in other contexts this might be asynchronous.
	 * @param user    Username to search associated with.
	 * @param service The service for which we seek a value, eg discourse
	 * @param key     Name of the value to retrieve.
	 * @returns       Promise that resolves to the value. Uses promise since other contexts might be asynchronous.
	 */
	public fetchValue(user: string, service: string, key: string): Promise<string> {
		const envVar = `${this.prefix}_${user}_${service}_${key}`.toUpperCase();
		if (process.env[envVar]) {
			return Promise.resolve(process.env[envVar]);
		}
		return Promise.reject(new DataHubError(DataHubErrorCode.ValueNotFound, `${envVar} not found.`));
	}
}

/**
 * Builds a object that will retrieve values direct from environment variables.
 * @param prefix  Namespace to search, eg 'PROCBOT' in 'PROCBOT_BLAH_BLAH_BLAH'
 * @returns       Built DataHub, ready to be queried for values
 */
export function createDataHub(prefix: string): DataHub {
	return new ConfigurationDataHub(prefix);
}
