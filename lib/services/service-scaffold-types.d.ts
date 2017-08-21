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

import { WorkerEvent } from '../framework/worker';
import { ServiceEvent } from './service-types';

/** Data object the ensures the existence of context and event for ServiceScaffold. */
export interface ServiceScaffoldServiceEvent extends ServiceEvent {
	context: any;
	type: string;
}

/** Incoming event object that guarantees some details about the data for ServiceScaffold generic handling. */
export interface ServiceScaffoldWorkerEvent extends WorkerEvent {
	data: ServiceScaffoldServiceEvent;
}
