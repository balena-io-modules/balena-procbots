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

import { ServiceEmitter } from '../services/service-types';

/** The ProcBotConfiguration interface holds per-bot configuration information. */
export interface ProcBotConfiguration {
	procbot: {
		/**
		 * The minimum version of the ProcBots framework that should be used for execution in
		 * the context of the configuration file.
		 */
		minimum_version?: number;
	};
}

/** Enables a Service to retrieve a configuration file from a specific service. */
export interface ConfigurationLocation {
	/**
	 * An instance of the ServiceEmitter to use, or a string denoting an inbuilt service.
	 * 'FS' can be used to retrieve a file-based configuration file, using `location` as the relative path.
	*/
	emitter: ServiceEmitter | string;
	/**
	 * Location of the configuration file. May be a string (for local 'FS') or an object
	 * specific to a service.
	 */
	location: string | any;
}

declare const enum ProcBotErrorCode {
	EmitterContextAbsent, NoConnectionFound, ConfigurationValueNotFound,
	IncompleteMessage, UnsupportedMessageAction,
}
