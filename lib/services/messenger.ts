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
import * as bodyParser from 'body-parser';
import * as express from 'express';
import TypedError = require('typed-error');
import * as _ from 'lodash';
import { Worker } from '../framework/worker';
import { WorkerClient } from '../framework/worker-client';
import {
	Logger,
	LogLevel,
} from '../utils/logger';
import {
	InterimContext,
	MessengerEmitResponse,
	MessengerEvent, MessengerIds,
	MessengerWorkerEvent, Metadata,
	PublicityIndicator,
	ReceiptContext, TransmitContext,
} from './messenger-types';
import {
	ServiceAPIHandle,
	ServiceEmitContext,
	ServiceEmitRequest,
	ServiceEmitter,
	ServiceListener,
	ServiceRegistration,
} from './service-types';

export abstract class Messenger extends WorkerClient<string|null> implements ServiceListener, ServiceEmitter {
	/**
	 * Make a handle context, using a receipt context and some extra information.
	 * @param event  Event to be converted.
	 * @param to     Destination for the handle context.
	 * @param toIds  Pre-populate the toIds, if desired.
	 * @returns      Newly created context for handling a message.
	 */
	public static initInterimContext(event: ReceiptContext, to: string, toIds: MessengerIds = {}): InterimContext {
		return {
			// Details from the ReceiptContext
			action: event.action,
			first: event.first,
			genesis: event.genesis,
			hidden: event.hidden,
			source: event.source,
			sourceIds: event.sourceIds,
			text: event.text,
			title: event.title,
			// Details from the arguments
			to,
			toIds,
		};
	}

	/** A place to put output for debug and reference. */
	protected static logger = new Logger();

	/**
	 * Retrieve from the environment array of strings to use as indicators of visibility
	 * @returns  Object of arrays of indicators, shown and hidden.
	 */
	protected static getIndicatorArrays(): { 'shown': PublicityIndicator, 'hidden': PublicityIndicator } {
		let shown;
		let hidden;
		try {
			// Retrieve publicity indicators from the environment
			shown = JSON.parse(process.env.MESSAGE_CONVERTOR_PUBLICITY_INDICATORS_OBJECT);
			hidden = JSON.parse(process.env.MESSAGE_CONVERTOR_PRIVACY_INDICATORS_OBJECT);
		} catch (error) {
			throw new Error('Message convertor environment variables not set correctly, indicators not json');
		}
		if (shown.length === 0 || hidden.length === 0) {
			throw new Error('Message convertor environment variables not set correctly, indicators zero length');
		}
		return { hidden, shown };
	}

	/**
	 * Encode the metadata of an event into a string to embed in the message.
	 * @param data    Event to gather details from.
	 * @param format  Format of the metadata encoding.
	 * @returns       Text with data embedded.
	 */
	protected static stringifyMetadata(data: TransmitContext, format: string): string {
		const indicators = Messenger.getIndicatorArrays();
		// Build the content with the indicator and genesis at the front
		switch (format.toLowerCase()) {
			case 'human':
				return `\n(${data.hidden ? indicators.hidden.word : indicators.shown.word} from ${data.source})`;
			case 'emoji':
				return `\n[${data.hidden ? indicators.hidden.emoji : indicators.shown.emoji}](${data.source})`;
			case 'img':
				const baseUrl = process.env.MESSAGE_CONVERTOR_IMG_BASE_URL;
				const hidden = data.hidden ? indicators.hidden.word : indicators.shown.word;
				const querystring = `?hidden=${hidden}&source=${encodeURI(data.source)}`;
				return `\n<img src="${baseUrl}${querystring}" height="18" />`;
			default:
				throw new Error(`${format} format not recognised`);
		}
	}

	/**
	 * Given a basic string this will extract a more rich context for the event, if embedded.
	 * @param message  Basic string that may contain metadata.
	 * @param format   Format of the metadata encoding.
	 * @returns        Object of content, genesis and hidden.
	 */
	protected static extractMetadata(message: string, format: string): Metadata {
		const indicators = Messenger.getIndicatorArrays();
		const wordCapture = `(${indicators.hidden.word}|${indicators.shown.word})`;
		const beginsLine = `(?:^|\\r|\\n)(?:\\s*)`;
		switch (format.toLowerCase()) {
			case 'human':
				const parensRegex = new RegExp(`${beginsLine}\\(${wordCapture} from (\\w*)\\)`, 'i');
				return Messenger.metadataByRegex(message, parensRegex);
			case 'emoji':
				const emojiCapture = `(${indicators.hidden.emoji}|${indicators.shown.emoji})`;
				const emojiRegex = new RegExp(`${beginsLine}\\[${emojiCapture}\\]\\((\\w*)\\)`, 'i');
				return Messenger.metadataByRegex(message, emojiRegex);
			case 'img':
				const baseUrl = _.escapeRegExp(process.env.MESSAGE_CONVERTOR_IMG_BASE_URL);
				const querystring = `\\?hidden=${wordCapture}&source=(\\w*)`;
				const imgRegex = new RegExp(`${beginsLine}<img src="${baseUrl}${querystring}" height="18" \/>`, 'i');
				return Messenger.metadataByRegex(message, imgRegex);
			case 'char':
				const charCapture = `(${indicators.hidden.char}|${indicators.shown.char})`;
				const charRegex = new RegExp(`${beginsLine}${charCapture}`, 'i');
				return Messenger.metadataByRegex(message, charRegex);
			default:
				throw new Error(`${format} format not recognised`);
		}
	}

	/**
	 * A daily rotating message from a configured list.
	 * @returns String of the message for today.
	 */
	protected static messageOfTheDay(): string {
		try {
			const messages = JSON.parse(process.env.MESSAGE_CONVERTOR_MESSAGES_OF_THE_DAY);
			const daysSinceDatum = Math.floor(new Date().getTime() / 86400000);
			return messages[daysSinceDatum % messages.length];
		} catch (error) {
			throw new Error('Message convertor environment variables not set correctly, motd not json');
		}
	}

	/**
	 * A singleton express instance for all web-hook based message services to share.
	 * @type {Express}.
	 */
	private static _expressApp: express.Express;

	/**
	 * Generic handler for stock metadata regex, must match the syntax of:
	 * first match is the indicator of visibility, second match is message source, remove the whole match for content.
	 * @param message String to evaluate into metadata.
	 * @param regex   Criteria for extraction.
	 * @returns       Object of the metadata, decoded.
	 */
	private static metadataByRegex(message: string, regex: RegExp): Metadata {
		const indicators = Messenger.getIndicatorArrays();
		const metadata = message.match(regex);
		if (metadata) {
			return {
				content: message.replace(regex, '').trim(),
				genesis: metadata[2] || null,
				hidden: !_.includes(_.values(indicators.shown), metadata[1]),
			};
		}
		return {
			content: message,
			genesis: null,
			hidden: true,
		};
	}

	/**
	 * Create or retrieve the singleton express app.
	 * @returns  Singleton express server app.
	 */
	protected static get expressApp(): express.Express {
		if (!Messenger._expressApp) {
			// Either MESSAGE_SERVICE_PORT from environment or PORT from Heroku environment
			const port = process.env.MESSAGE_SERVICE_PORT || process.env.PORT;
			if (!port) {
				throw new Error('No inbound port specified for express server');
			}
			// Create and log an express instance
			Messenger._expressApp = express();
			Messenger._expressApp.use(bodyParser.json());
			Messenger._expressApp.listen(port);
			Messenger.logger.log(LogLevel.INFO, `---> Started MessageService shared web server on port '${port}'`);
		}
		return Messenger._expressApp;
	}

	/**
	 * Promise to find the comment history of a particular thread.
	 * @param thread  ID of the thread to search.
	 * @param room    ID of the room in which the thread resides.
	 * @param filter  Criteria to match.
	 * @param search  Optional, some words which may be used to shortlist the results.
	 */
	public abstract fetchNotes: (thread: string, room: string, filter: RegExp, search?: string) => Promise<string[]>;

	/**
	 * Promise to turn the data enqueued into a generic message format.
	 * @param data  Raw data from the enqueue, remembering this is as dumb and quick as possible.
	 * @returns     A promise that resolves to the generic form of the event.
	 */
	public abstract makeGeneric: (data: MessengerEvent) => Promise<ReceiptContext>;

	/**
	 * Promise to turn a generic message format into a form suitable for emitting.
	 * @param data  Generic message format to encode.
	 * @returns     A promise that resolves to an emit context, which is as dumb as possible.
	 */
	public abstract makeSpecific: (data: TransmitContext) => Promise<ServiceEmitContext>;

	/** Awaken this class as a listener. */
	protected abstract activateMessageListener: () => void;

	/**
	 * Deliver the payload to the service. Sourcing the relevant context has already been performed.
	 * @param data  The object to be delivered to the service.
	 * @returns     Response from the service endpoint.
	 */
	protected abstract sendPayload: (data: ServiceEmitContext) => Promise<MessengerEmitResponse>;

	/** A boolean flag for if this object has been activated as a listener. */
	private listening: boolean = false;
	/** An object of arrays storing events by trigger and their actions. */
	private _eventListeners: { [event: string]: ServiceRegistration[] } = {};

	/**
	 * Build this service, specifying whether to awaken as a listener.
	 * @param listener  Whether to start listening during construction.
	 */
	constructor(listener: boolean) {
		super();
		if (listener) {
			// Allow the sub-constructor to set up sessions, etc, before listening
			process.nextTick(this.listen);
		}
	}

	/** Start the object listening if it isn't already. */
	public listen = () => {
		// Ensure the code in the child object gets executed a maximum of once
		if (!this.listening) {
			this.listening = true;
			this.activateMessageListener();
			Messenger.logger.log(LogLevel.INFO, `---> Started '${this.serviceName}' listener`);
		}
	}

	/**
	 * Store an event of interest, so that the method gets triggered appropriately.
	 * @param registration  Registration object with event trigger and other details.
	 */
	public registerEvent(registration: ServiceRegistration): void {
		// Store each event registration in an object of arrays.
		for (const event of registration.events) {
			if (!this._eventListeners[event]) {
				this._eventListeners[event] = [];
			}
			this._eventListeners[event].push(registration);
		}
	}

	/**
	 * Emit data to the service.
	 * @param data  Service Emit Request to send, if relevant.
	 * @returns     Details of the successful transmission from the service.
	 */
	public sendData(data: ServiceEmitRequest): Promise<MessengerEmitResponse> {
		// Check that the data has specifies a task for our emitter, before passing it on
		if (data.contexts[this.serviceName]) {
			return this.sendPayload(data.contexts[this.serviceName]);
		}
		// If this data has no task for us then no-op is the correct resolution
		return Promise.resolve({
			err: new TypedError(`No ${this.serviceName} context`),
			source: this.serviceName,
		});
	}

	 /**
	 * Queue an event ready for running in a child.
	 * @param data  The WorkerEvent to add to the queue for processing.
	 */
	public queueEvent(data: MessengerWorkerEvent) {
		// This type guards a simple pass-through
		super.queueEvent(data);
	}

	/**
	 * Turns the generic, messenger, name for an event into a specific trigger name for this class.
	 * @param eventType  Name of the event to translate, eg 'message'.
	 * @returns          This class's equivalent, eg 'post'.
	 */
	public abstract translateEventName(eventType: string): string;

	/**
	 * Pass an event to registered listenerMethods.
	 * @param event  Enqueued event from the listener.
	 * @returns      Promise that resolves once the event is handled.
	 */
	protected handleEvent = (event: MessengerEvent): Promise<void> => {
		// Retrieve and execute all the listener methods, squashing their responses
		const listeners = this._eventListeners[event.cookedEvent.type] || [];
		return Promise.map(listeners, (listener) => {
			return listener.listenerMethod(listener, event);
		}).return();
	}

	/**
	 * Get a Worker object for the provided event, threaded by context.
	 * @param event  Event as enqueued by the listener.
	 * @returns      Worker for the context associated.
	 */
	protected getWorker = (event: MessengerWorkerEvent): Worker<string|null> => {
		// Attempt to retrieve an active worker for the context
		const context = event.data.cookedEvent.context;
		const retrieved = this.workers.get(context);
		if (retrieved) {
			return retrieved;
		}
		// Create and store a worker for the context
		const created = new Worker<string>(context, this.removeWorker);
		this.workers.set(context, created);
		return created;
	}

	/**
	 * Get the service name, as required by the framework.
	 * @return  Name of the service.
	 */
	abstract get serviceName(): string

	/**
	 * Retrieve the SDK API instance handle for the service, should one exist.
	 * @return  Service SDK API handle or void.
	 */
	abstract get apiHandle(): ServiceAPIHandle | void;
}
