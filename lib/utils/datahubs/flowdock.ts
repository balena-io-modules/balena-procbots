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
import * as _ from 'lodash';
import { FlowdockConnectionDetails, FlowdockMessage } from '../../services/flowdock-types';
import { DataHub } from './datahub';

export class FlowdockDataHub implements DataHub {
	private session: Session;
	private organization: string;

	constructor(data: FlowdockConnectionDetails) {
		this.session = new Session(data.token);
		this.organization = data.organization;
	}

	/**
	 * Search for the specified value associated with a user.
	 * @param user    Username to search associated with.
	 * @param service The service for which we seek a value, eg discourse
	 * @param key     Name of the value to retrieve.
	 * @returns       Promise that resolves to the value.
	 */
	public fetchValue(user: string, service: string, key: string): Promise<string> {
		// Retrieve a particular regex from the 1-1 message history of the user
		const findKey = new RegExp(`My ${service} ${key} is (\\S+)`, 'i');
		return this.fetchPrivateMessages(user, findKey)
		.then((valueArray) => {
			const value = valueArray[valueArray.length - 1].match(findKey);
			if (value) {
				return value[1];
			}
			throw new Error(`Could not find value $key for $user`);
		});
	}

	/**
	 * Search for recent private messages with our account that match on username and regex.
	 * @param username  Scope of the private messages to search.
	 * @param filter    Narrow our search to just matches.
	 * @returns         Promise that resolves to the message strings.
	 */
	private fetchPrivateMessages(username: string, filter: RegExp): Promise<string[]> {
		// Fetch the id then 1-1 history associated with the username
		return this.fetchUserId(username)
		.then((userId) => {
			return this.fetchFromSession(`/private/${userId}/messages`)
				.then((fetchedMessages) => {
					// Prune and clean the message history to text of interest
					return _.filter(fetchedMessages, (message: FlowdockMessage) => {
						return filter.test(message.content);
					}).map((message: FlowdockMessage) => {
						return message.content;
					});
				});
		});
	}

	/**
	 * Fetch a user's id from their username.
	 * @param username  Username to search for.
	 * @returns         id of the user.
	 */
	private fetchUserId = (username: string): Promise<string | undefined> => {
		// Get all the users of the service
		return this.fetchFromSession(`/organizations/${this.organization}/users`)
			.then((foundUsers) => {
				// Generate an array of user objects with matching username
				const matchingUsers = _.filter(foundUsers, (eachUser: any) => {
					return eachUser.nick === username;
				});
				// Return id if we've exactly one user for a particular username
				if (matchingUsers.length === 1) {
					return(matchingUsers[0].id);
				}
			});
	}

	/**
	 * Utility function to structure the flowdock session as a promise a little.
	 * @param path    Endpoint to retrieve.
	 * @param search  Optional, some words which may be used to shortlist the results.
	 * @returns       Response from the session.
	 */
	private fetchFromSession = (path: string, search?: string): Promise<any> => {
		return new Promise<any>((resolve, reject) => {
			// The flowdock service both emits and calls back the error.
			// We're wrapping the emit in a promise reject and ignoring the call back
			this.session.on('error', reject);
			this.session.get(path, {search}, (_error?: Error, result?: any) => {
				this.session.removeListener('error', reject);
				if (result) {
					resolve(result);
				}
			});
		});
	}

}

export function createDataHub(data: FlowdockConnectionDetails): DataHub {
	return new FlowdockDataHub(data);
}
