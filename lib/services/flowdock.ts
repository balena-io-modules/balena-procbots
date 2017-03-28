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
import * as path from 'path';
import * as request from 'request-promise';
import { FlowdockEmitRequestContext } from './flowdock-types';
import { ServiceEmitContext, ServiceEmitRequest, ServiceEmitResponse, ServiceEmitter } from './service-types';

// The Flowdock service currently allows a client to send data to an Inbox.
export class FlowdockService implements ServiceEmitter {
    private _serviceName = path.basename(__filename.split('.')[0]);

    public sendData(data: ServiceEmitRequest): Promise<ServiceEmitResponse> {
        // Try and find the context for the Flowdock request.
        // This code is going to be required in all sendData() methods. We should add an
        // interface method that provides it.
        const emitContext: ServiceEmitContext = _.pickBy(data.contexts, (_val, key) => {
            return key === this._serviceName;
        });
        const flowdockContext: FlowdockEmitRequestContext = emitContext.flowdock;

        //  Make a straight post to the inbox from the client.
        const requestOpts = {
            body: flowdockContext,
            json: true,
            url: `https://api.flowdock.com/messages/team_inbox/${flowdockContext.roomId}`,
        };

        // We don't wait for a response, we have no control over it anyway.
        return request.post(requestOpts).then((resData: any) => {
            return {
                response: resData,
                source: this._serviceName
            };
        }).catch((err: Error) => {
            console.log(`FlowdockAdapter failed to post to Flowdock:\n${err.message}`);
            return {
                err,
                source: this._serviceName
            };
        });
    }

    // Get the name of this service.
    get serviceName(): string {
        return this._serviceName;
    }
}

export function createServiceEmitter(): ServiceEmitter {
    return new FlowdockService();
}
