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
import * as GithubApi from 'github';
import TypedError = require('typed-error');
import { Express } from 'express';
import * as GithubApiTypes from '../apis/githubapi-types';
import { ConfigurationLocation, ProcBotConfiguration } from '../framework/procbot-types';
import { ServiceAPIHandle, ServiceConstructor, ServiceEmitContext, ServiceEvent,
	ServiceListenerMethod, ServiceRegistration, ServiceType } from './service-types';

/** The Github Service can be used as either an App or a User Personal Access Token. */
export const enum GithubLogin {
	/** Application instance. */
	App = 0,
	/** User instance. */
	PAT = 1
}

/** Allows a service to login to Github as an Integration, using the ID. */
export interface GithubApp {
	/** App ID of the Github Integration to run as. */
	appId: number;
	/** The Github PEM as an encoded Base64 value. */
	pem: string;
	/** Type of service, an App. */
	type: GithubLogin.App;
}

/** Allows a service to login to Github as a user, using username and Personal Access Token. */
export interface GithubPAT {
	/** The PAT for the user to login as. */
	pat: string;
	/** Type of service, a PAT. */
	type: GithubLogin.PAT;
}

/** Base constructor object required to create a GithubListener or GithubEmitter. */
export interface GithubConstructor extends ServiceConstructor {
	/** Client name (eg. VersionBot). */
	client: string;
	/** Whether to run the service as an App or a User. */
	authentication: GithubApp | GithubPAT;
	/** Type of service ('listener' or 'emitter'). */
	type: ServiceType;
}

/** Constructor object for a GithubListener. */
export interface GithubListenerConstructor extends GithubConstructor {
	/** Server or port the service should listen on for the webhook. */
	ingress: Express | number;
	/** Path the service should listen on for the webhook. */
	path: string;
	/** Github Webhook secret string for the Integration, authenticating events sent by Github. */
	webhookSecret: string;
}

/** The GithubHandle extends the normal ServiceAPIHandle to include the Github API instance. */
export interface GithubHandle extends ServiceAPIHandle {
	github: GithubApi;
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
	/** If relevant, labels applying to the Issue or PR associated with the event. */
	labels?: GithubApiTypes.Label[];
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

/**
 * The location object to allow a Github ServiceEmitter to locate and retrieve a
 * configuration file.
 */
export interface GithubConfigLocation extends ConfigurationLocation {
	/** The location of the configuration file. */
	location: {
		/** Owner of the repository. */
		owner: string;
		/** The repository name. */
		repo: string;
		/** Absolute path in the repository where the configuration file is located, inclusive of filename. */
		path?: string;
	};
}
