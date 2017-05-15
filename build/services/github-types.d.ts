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

import * as GithubApi from 'github';
import { ProcBotConfiguration } from '../framework/procbot-types';
import { ServiceEmitContext, ServiceEvent, ServiceListenerMethod, ServiceRegistration,
    ServiceType} from './service-types';

/** The Github service can be used as either an Integration or a User. */
type GithubLoginType = 'integration' | 'user';

/** Allows a service to login to Github as an Integration, using the ID. */
export interface GithubIntegration {
    /** Integration ID of the Github Integration to run as. */
    integrationId: number;
    /** The Github PEM as an encoded Base64 value. */
    pem: string;
    /** Type of service ('listener' or 'emitter'). */
    type: GithubLoginType;
}

/** Allows a service to login to Github as a user, using username and Personal Access Token. */
export interface GithubUser {
    /** The PAT for the user to login as. */
    pat: string;
    /** The username of the user to login as. */
    user: string;
    /** Type of service ('listener' or 'emitter'). */
    type: GithubLoginType;
}

/** Base constructor object required to create a GithubListener or GithubEmitter. */
export interface GithubConstructor {
    /** Client name (eg. VersionBot). */
    client: string;
    /** Whether to run the service as an Integration or a User. */
    loginType: GithubIntegration | GithubUser;
    /** Type of service ('listener' or 'emitter'). */
    type: ServiceType;
}

/** Constructor object for a GithubListener. */
export interface GithubListenerConstructor extends GithubConstructor {
    /** Path the service should listen on for the webhook. */
    path: string;
    /** Port the service should listen on for the webhook. */
    port: number;
    /** Github Webhook secret string for the Integration, authenticating events sent by Github. */
    webhookSecret: string;
}

/** Github registration object detailing events, triggers and supressions for a worker. */
export interface GithubRegistration extends ServiceRegistration {
    /** Client's listener method to call when events are ready for processing. */
    listenerMethod: GithubListenerMethod;
    /** Labels on a PR or Issue that, if present, will suppress the sending of events to a client. */
    suppressionLabels?: string[];
    /**
     * Labels on a PR or Issue that, if present, will ensure the event is sent to a client.
     * Note that should any of the suppression labels also be present, they will override these labels.
     */
    triggerLabels?: string[];
}

/** Cooked event data from Github. */
export interface GithubCookedData {
    /** The data from Github, processed as required. */
    data: any;
    /** An instance of the Github SDK API. */
    githubApi: GithubApi;
    /** The currently valid authentication token used by the Github SDK API. */
    githubAuthToken: string;
    /** The type of data. */
    type: string;
}

/**
 * The method implemented by a client of a GithubListener to receive events ready for processing.
 * @param registration  The registration details specifying the object passed by the client on registration.
 *                      This can be used as a context.
 * @param event         The actual event passed to the GithubListener.
 * @return              A promise that is fulfilled once the client has finished processing the event.
 */
export type GithubListenerMethod = (registration: GithubRegistration, event: ServiceEvent) => Promise<void>;

/**
 * A wrapper for the Github SDK API method style of call.
 * @param data  Any valid data for the particular call being made.
 * @return      A promise containing the data returned as part of the response.
 */
export type GithubApiMethod = (data: any) => Promise<any>;

/** The context required for sending data to Github via the GithubEmitter. */
export interface GithubEmitRequestContext extends ServiceEmitContext {
    /** The method to use, as a Github SDK API reference. */
    method: GithubApiMethod;
    /** The data for the relevant method. */
    data: any;
}
