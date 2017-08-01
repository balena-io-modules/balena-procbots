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

/** A definition for a service that allows the retrieval of user-set values. */
export interface DataHub {
	/**
	 * Retrieve a value that a user has set.
	 * @param user   The user who's data set we wish to search.
	 * @param value  This should be 'key'.  It is the data we wish to search for.
	 */
	fetchValue(user: string, value: string): Promise<string>;
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
