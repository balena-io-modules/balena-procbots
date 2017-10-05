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
import { DataHub, DataHubError, DataHubErrorCode } from './datahub';

/**
 * A service retrieves values from a provided object
 */
export class SimpleDataHub implements DataHub {
	/** A simple object of key, value pairs.  Used to get values when sought. */
	private values: Map<string, string> = new Map();

	constructor(values: { [key: string]: string }) {
		_.forEach(values, (value, key) => {
			this.values.set(key, value);
		});
	}
	/**
	 * Search for the specified value associated with a user, in other contexts this might be asynchronous.
	 * @param user    Username to search associated with.
	 * @param service The service for which we seek a value, eg discourse
	 * @param key     Name of the value to retrieve.
	 * @returns       Promise that resolves to the value.
	 */
	public fetchValue(user: string, service: string, key: string): Promise<string> {
		const index = `${user}_${service}_${key}`.toLowerCase();
		const value = this.values.get(index);
		if (value) {
			return Promise.resolve(value);
		}
		return Promise.reject(new DataHubError(DataHubErrorCode.ValueNotFound, `${index} not found.`));
	}
}

/**
 * Builds a DataHub that will find values in a provided object.
 * @param values  key-value pairs that are used to answer data searches.
 * @returns       Built DataHub object, ready to seek answers.
 */
export function createDataHub(values: { [key: string]: string }): DataHub {
	return new SimpleDataHub(values);
}
