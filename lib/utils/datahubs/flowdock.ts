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
import { FlowdockConnectionDetails } from '../../services/flowdock-types';
import { DataHub } from './datahub';

export class FlowdockDataHub implements DataHub {
	private session: Session;
	private organization: string;

	constructor(data: FlowdockConnectionDetails) {
		this.session = new Session(data.token);
		this.organization = data.organization;
	}

	public fetchValue(_user: string, _value: string): Promise<string> {
		throw new Error();
	}
}

export function createTranslator(data: FlowdockConnectionDetails): DataHub {
	return new FlowdockDataHub(data);
}
