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
import { ServiceEvent, ServiceListenerMethod, ServiceRegistration, ServiceType } from './service-types';

// GithubService ------------------------------------------------------------------

// The Github service can be used as either an Integration or a User.
type GithubLoginType = 'integration' | 'user';

// Allows a service to login to Github as an Integration, using the ID.
export interface GithubIntegration {
    type: GithubLoginType;
    integrationId: number;
    pem: string;
}

// Allows a service to login to Github as a user, using username and Personal Access Token.
export interface GithubUser {
    type: GithubLoginType;
    user: string;
    pat: string;
}

// Base constructor type for listeners and emitters.
// Emitters currently use this base type.
//  * Client name (eg. VersionBot)
//  * Whether to run the service as an Integration or a User
//  * Type of service (listener or emitter)
export interface GithubConstructor {
    client: string;
    loginType: GithubIntegration | GithubUser;
    type: ServiceType;
}

// Constructor for a listener.
// Requires:
//  * port the service should listen on for the webhook
//  * path the service should listen on for the webhook
//  * Webhook secret string for authenticating events via webhook
export interface GithubListenerConstructor extends GithubConstructor {
    path: string;
    port: number;
    webhookSecret: string;
}

// Github registration object detailing events, triggers and supressions for a
// worker.
export interface GithubRegistration extends ServiceRegistration {
    triggerLabels?: string[];
    suppressionLabels?: string[];
    listenerMethod: GithubListenerMethod;
}

// Cooked event data from Github.
export interface GithubCookedData {
    data: any;
    githubApi: GithubApi;
    githubAuthToken: string;
    type: string;
}

// A GithubActionMethod is the method that will be used to process an event.
export type GithubListenerMethod = (registration: GithubRegistration, event: ServiceEvent) => Promise<void>;

// Method used by the Github API.
export type GithubApiMethod = (data: any) => Promise<any>;

// Emitter for sending data to Github.
export interface GithubEmitRequestContext {
    method: GithubApiMethod;
    data: any;
}
