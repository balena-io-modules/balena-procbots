import * as Promise from 'bluebird';
import * as chai from 'chai';
import * as ChaiAsPromised from 'chai-as-promised';
import * as _ from 'lodash';
import 'mocha';
import * as moment from 'moment';
import { SyncBot, SyncBotConstructor } from '../../lib/bots/syncbot';
import { MessengerService } from '../../lib/services/messenger';
import { FlowDefinition, FlowMapping, MessengerAction } from '../../lib/services/messenger-types';
import { TranslatorScaffold } from '../../lib/services/messenger/translators/translator-scaffold';
import { ServiceEmitRequest, ServiceEmitResponse, ServiceType } from '../../lib/services/service-types';
import { Logger } from '../../lib/utils/logger';

chai.use(ChaiAsPromised);
chai.should();

class MappingTester {
	public static flattenResponses(responses: ServiceEmitResponse[]): string[] {
		const messagesOnService: string[] = [];
		_.forEach(responses, (response) => {
			_.forEach(response.response, (message) => {
				messagesOnService.push(TranslatorScaffold.extractWords(message.content).join(' '));
			});
		});
		return messagesOnService;
	}

	private static renderDefinition(definition: FlowDefinition, thread?: string): string {
		const output = [];
		output.push(definition.service);
		output.push(definition.flow);
		if (thread) {
			output.push(thread);
		}
		return output.join('/');
	}

	private readonly botName: string;
	private readonly sourceFlow: FlowDefinition;
	private readonly destinationFlow: FlowDefinition;
	private sourceThread: string;
	private _destinationThread: string;
	private title: string;
	private readonly emitter: MessengerService;
	private _firedMessages: string[] = [];

	constructor(config: SyncBotConstructor, mapping: FlowMapping, emitter: MessengerService) {
		this.botName = config.SYNCBOT_NAME;
		this.sourceFlow = mapping.source;
		this.destinationFlow = mapping.destination;
		this.emitter = emitter;
	}

	public render(): string {
		return [
			MappingTester.renderDefinition(this.sourceFlow, this.sourceThread),
			MappingTester.renderDefinition(this.destinationFlow, this._destinationThread),
		].join('=>');
	};

	public makeThread(
		title: string,
		text: string,
		options?: {
			shouldBreadcrumb?: boolean
		},
	): Promise<ServiceEmitResponse> {
		const shouldBreadcrumb = _.get(options, ['shouldBreadcrumb'], false) as boolean;
		const time = moment().toISOString();
		this.title = (shouldBreadcrumb && title) ? `${title} ${this.sourceFlow.service} ${time}` : title;
		return this.emitAction(
			MessengerAction.CreateThread,
			true,
			{ title, text, shouldBreadcrumb },
		).then((response) => {
			this.sourceThread = response.response.thread;
			return response;
		});
	}

	public makeComment(
		text: string,
		options?: {
			targetSource?: boolean,
			shouldBreadcrumb?: boolean,
			hidden?: boolean,
		},
	): Promise<ServiceEmitResponse> {
		const shouldBreadcrumb = _.get(options, ['shouldBreadcrumb'], false) as boolean;
		const targetSource = _.get(options, ['targetSource'], true) as boolean;
		const hidden = _.get(options, ['hidden'], false) as boolean;
		return this.emitAction(
			MessengerAction.CreateMessage,
			targetSource,
			{ hidden, text, shouldBreadcrumb },
		);
	}

	public readThread(
		options?: {
			targetSource?: boolean,
		},
	): Promise<ServiceEmitResponse[]> {
		const targetSource = _.get(options, ['targetSource'], true) as boolean;
		return Promise.all([
			this.emitAction(
				MessengerAction.ListWhispers,
				targetSource,
			),
			this.emitAction(
				MessengerAction.ListReplies,
				targetSource,
			),
		]);
	}

	public get firedMessages(): string[] {
		return this._firedMessages;
	}

	public get destinationThread(): Promise<string> {
		if (this._destinationThread) {
			return Promise.resolve(this._destinationThread);
		}
		return this.cacheDestinationThread()
		.then(() => {
			return this._destinationThread;
		});
	}

	private cacheDestinationThread(): Promise<void> {
		return this.emitAction(
			MessengerAction.ReadConnection,
			true,
		).then((response) => {
			this._destinationThread = response.response.thread;
		});
	};

	private emitAction(
		action: MessengerAction,
		targetSource: boolean,
		options?: {
			text: string,
			shouldBreadcrumb?: boolean,
			title?: string,
			hidden?: boolean,
		},
	): Promise<ServiceEmitResponse> {
		const payload = this.makePayload(action, targetSource, options);
		const text = _.get(payload, ['contexts', 'messenger', 'details', 'text']);
		if (text) {
			this._firedMessages.push(TranslatorScaffold.extractWords(payload.contexts.messenger.details.text).join(' '));
		}
		return this.emitter.sendData(payload)
		.then((response) => {
			if (response.err) {
				throw response.err;
			}
			return response;
		});
	}

	private makeSourceObject(action: MessengerAction) {
		if (action === MessengerAction.ReadConnection) {
			return {
				service: this.destinationFlow.service,
				flow: this.destinationFlow.flow,
			};
		}
		return {
			service: 'test',
			flow: 'test',
			thread: 'test',
			username: this.botName,
		};
	}

	private makePayload(
		action: MessengerAction,
		targetSource: boolean,
		options?: {
			text?: string,
			shouldBreadcrumb?: boolean,
			title?: string,
			hidden?: boolean,
		},
	): ServiceEmitRequest {
		const time = moment().toISOString();
		const service = (targetSource) ? this.sourceFlow.service : this.destinationFlow.service;
		const flow = (targetSource) ? this.sourceFlow.flow : this.destinationFlow.flow;
		const thread = (targetSource) ? this.sourceThread : this._destinationThread;
		const text = _.get(options, ['text']);
		const hidden = _.get(options, ['hidden'], false);
		const shouldBreadcrumb = _.get(options, ['shouldBreadcrumb'], false);
		return {
			contexts: {
				messenger: {
					action,
					target: {
						service,
						username: this.botName,
						flow,
						thread,
					},
					details: {
						service: 'test_a',
						flow: 'test_b',
						handle: this.botName,
						hidden,
						tags: [],
						text: (shouldBreadcrumb && text) ? `${text}\n\n${service} ${time}` : text,
						time,
						title: this.title,
					},
					source: this.makeSourceObject(action),
				},
			},
			source: 'tests',
		};
	}
}

describe('lib/bots/syncbot.ts', function() {
	const getConfig: Promise<SyncBotConstructor> = SyncBot.retrieveConfiguration({
		emitter: 'string',
		location: 'configs/syncbot_e2e.yml',
	}).then((rawConfig) => {
		if (rawConfig) {
			return SyncBot.injectEnvironmentVariables(rawConfig);
		}
		throw new Error('No configuration file found.');
	});

	const getMappings: Promise<FlowMapping[]> = getConfig.then((rawConfig) => {
		return _.get(rawConfig, 'SYNCBOT_MAPPINGS', []);
	});

	const getMessenger: Promise<MessengerService> = getConfig.then((config) => {
		return new MessengerService({
			metadataConfig: config.SYNCBOT_METADATA_CONFIG,
			ingress: parseInt(config.SYNCBOT_PORT, 10),
			serviceName: 'messenger',
			subServices: config.SYNCBOT_SERVICE_CONSTRUCTORS,
			type: ServiceType.Emitter,
		}, new Logger());
	});

	describe('SyncBot.retrieveConfiguration', () => {
		it('should retrieve an array of mappings from the test configuration', function() {
			return getMappings.then((mappings) => {
				mappings.length.should.be.gt(0);
			});
		});
	});

	describe('each mapping should pass scrutiny', function() {
		const delay = 3000; // Avoid API timeouts
		return Promise.props({
			mappings: getMappings,
			messenger: getMessenger,
			config: getConfig,
		}).then((prerequisites) => {
			return Promise.each(prerequisites.mappings, (mapping) => {
				const mappingTester = new MappingTester(prerequisites.config, mapping, prerequisites.messenger);
				describe(mappingTester.render(), function() {
					this.timeout(delay * 3);
					it('should emit a thread on the source service', function() {
						return mappingTester.makeThread(
							'Test thread with "stuff"',
							[
								'This is the opening comment.',
								'```',
								'code',
								'```',
								'> quote',
							].join('\n'),
							{ shouldBreadcrumb: true },
						).then((response) => {
							response.source.should.eq('messenger');
							response.response.should.have.property('thread');
							response.response.should.have.property('url');
							(typeof response.response.url).should.eq('string');
						}).delay(delay);
					});

					it('should emit a reply on the source thread', function() {
						return mappingTester.makeComment(
							'This is a reply on the source thread',
							{ shouldBreadcrumb: true },
						).then((response) => {
							response.source.should.eq('messenger');
						}).delay(delay);
					});

					it('should emit a whisper on the source thread', function() {
						return mappingTester.makeComment(
							'This is a whisper on the source thread',
							{ shouldBreadcrumb: true, hidden: true },
						).then((response) => {
							response.source.should.eq('messenger');
						}).delay(delay);
					});

					it('should have recorded the destination thread', function() {
						return mappingTester.destinationThread
						.then((thread) => {
							(typeof thread).should.eq('string');
						}).delay(delay);
					});

					it('should emit a reply on the destination thread', function() {
						return mappingTester.makeComment(
							'This is a reply on the destination thread',
							{ shouldBreadcrumb: true, targetSource: false },
						).then((response) => {
							response.source.should.eq('messenger');
						}).delay(delay);
					});

					it('should emit a whisper on the destination thread', function() {
						return mappingTester.makeComment(
							'This is a whisper on the destination thread',
							{ shouldBreadcrumb: true, hidden: true, targetSource: false },
						).then((response) => {
							response.source.should.eq('messenger');
						}).delay(delay);
					});

					it('should wait for a few seconds', function() {
						return Promise.delay(delay);
					});

					it('should have created all the comments on the destination thread', function() {
						return mappingTester.readThread(
							{ targetSource: false },
						).then((responses) => {
							const messagesOnService = MappingTester.flattenResponses(responses);
							_.forEach(mappingTester.firedMessages, (firedMessage) => {
								messagesOnService.should.contain(firedMessage);
							});
						}).delay(delay);
					});

					it('should have created all the comments on the source thread', function() {
						return mappingTester.readThread()
						.then((responses) => {
							const messagesOnService = MappingTester.flattenResponses(responses);
							_.forEach(mappingTester.firedMessages, (firedMessage) => {
								messagesOnService.should.contain(firedMessage);
							});
						}).delay(delay);
					});

					it('should not have an excessive quantity of noise on the source thread', function() {
						return mappingTester.readThread()
						.then((responses) => {
							const messagesOnService = MappingTester.flattenResponses(responses);
							messagesOnService.length.should.be.lte(mappingTester.firedMessages.length + 2);
						}).delay(delay);
					});

					it('should not have an excessive quantity of noise on the destination thread', function() {
						return mappingTester.readThread(
							{ targetSource: false },
						)
						.then((responses) => {
							const messagesOnService = MappingTester.flattenResponses(responses);
							messagesOnService.length.should.be.lte(mappingTester.firedMessages.length + 2);
						}).delay(delay);
					});
				});
			});
		});
	});
});
