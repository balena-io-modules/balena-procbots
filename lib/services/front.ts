/*
Copyright 2017 Resin.io

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
import { Front, ResponseData } from 'front-sdk';
import * as _ from 'lodash';
import * as path from 'path';
import { AlertLevel, Logger } from '../utils/logger';
import { FrontEmitRequestContext, FrontEmitterConstructor, FrontHandle } from './front-types';
import { ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter, ServiceEvent,
    ServiceRegistration } from './service-types';

// The Flowdock service currently allows a client to send data to an Inbox.
export class FrontService implements ServiceEmitter {
    private frontSDK: Front;
    private _serviceName = path.basename(__filename.split('.')[0]);
    private eventTriggers: ServiceRegistration[] = [];
    private apiKey: string;
    private logger = new Logger();

    // The constructor is passed a specific data type.
    constructor(constObj: FrontEmitterConstructor) {
        // Only the listener deals with events.
        const emitterConstructor = <FrontEmitterConstructor>constObj;
        this.apiKey = emitterConstructor.apiKey;

        // Create new Front SDK object.
        this.frontSDK = new Front(this.apiKey);
    }

    // Send data to Front.
    public sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse> {
        // Get the Front context.
        const emitContext: ServiceEmitContext = _.pickBy(data.contexts, (_val, key) => {
            return key === this._serviceName;
        });
        const flowdockContext: FrontEmitRequestContext = emitContext.front;

        return flowdockContext.method(flowdockContext.data).then((result: ResponseData) => {
            return {
                response: result,
                source: this._serviceName
            };
        }).catch((err: Error) => {
            return {
                err,
                source: this._serviceName
            };
        });
    }

    /**
     * Retrieve the Front SDK API handle.
     * @return  Front SDK handle.
     */
    get apiHandle(): FrontHandle {
        return {
            front: this.frontSDK
        };
    }

    // Get the name of this service.
    get serviceName(): string {
        return this._serviceName;
    }

    // Handles all Front events to trigger actions, should the parameters meet those
    // registered.
    protected handleFrontEvent = (event: ServiceEvent): Promise<void> => {
        console.log(event);
        return Promise.map(this.eventTriggers, (registration) => {
            // Is the event one of the type that triggers the action?
            if (_.includes(registration.events, event.cookedEvent.type)) {
                return registration.listenerMethod(registration, event)
                .catch((err: Error) => {
                    // We log the error, so that it's saved and matches up with any Alert.
                    this.logger.alert(AlertLevel.ERROR, 'Error thrown in main event/label filter loop:' +
                        err.message);
                });
            }
        }).return();
    }
}

// Create a new Front service Emitter.
export function createServiceEmitter(constObj: FrontEmitterConstructor): ServiceEmitter {
    return new FrontService(constObj);
}
