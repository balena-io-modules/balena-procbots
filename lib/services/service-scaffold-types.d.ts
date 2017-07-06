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

import * as express from 'express';
import { WorkerEvent } from '../framework/worker';
import { ServiceEvent, ServiceType } from './service-types';

/** Data object the ensures the existence of context and event for ServiceScaffold. */
export interface ServiceScaffoldEvent extends ServiceEvent {
	/** Scope identifier within which execution order is guaranteed. */
	context: any;
	/** Definition of the type of the event, used to calculate which listeners should be activated. */
	type: string;
}

/** Incoming event object that guarantees some details about the data for ServiceScaffold generic handling. */
export interface ServiceScaffoldWorkerEvent extends WorkerEvent {
	data: ServiceScaffoldEvent;
}

/** Enumerated list of the things that may go wrong with a ServiceScaffold. */
export const enum ServiceScaffoldErrorCode {
	ContextAbsent, NoExpressServer,
}

/**
 * Details that may be used, when constructing, to define an express instance.
 * May be a port number, true (to use default port) or an actual express instance.
 */
export type ServerDetails = number | express.Express;

export interface ServiceScaffoldConstructor {
	/** Endpoint path to listen to. Defaults to the name of the service. */
	path?: string;
	/** Port number or server instance to listen to. */
	server?: ServerDetails;
	/** Specifies that this listener must be a listener. */
	type: ServiceType;
}
