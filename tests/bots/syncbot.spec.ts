/// <reference types="mocha" />
import { expect } from 'chai';

import { SyncBot } from '../../lib/bots/syncbot';
import { ProcBotEnvironmentProperties } from '../../lib/framework/procbot-types';

describe('lib/bots/syncbot.ts', () => {

	describe('SyncBot.getErrorSolution', () => {
		it('should find the correct fixes for a given error message', () => {
			const solutionSuggestion = SyncBot.getErrorSolution(
				'foo',
				'bah',
				{
					foo: {
						'^ba': {
							description: 'baz',
							fixes: [
								'do something',
							],
						},
					},
				},
			);
			expect(solutionSuggestion).to.deep.equal({
				description: 'baz',
				fixes: [
					'do something',
				],
			});
		});
	});

	describe('SyncBot.messageIntoEnvQuery', () => {
		it('should break apart a simple property query into a request', () => {
			expect(SyncBot.messageIntoEnvQuery('@testbot pid')).to.deep.equal({
				filter: {
					package: [],
					process: [],
					system: []
				},
				query: {
					package: [],
					process: ['pid'],
					system: []
				}
			});
		});

		it('should break apart a specific property query into a request', () => {
			expect(SyncBot.messageIntoEnvQuery('@testbot system.uptime')).to.deep.equal({
				filter: {
					package: [],
					process: [],
					system: []
				},
				query: {
					package: [],
					process: [],
					system: ['uptime']
				}
			});
		});

		it('should break apart a simple property filter into a request', () => {
			expect(SyncBot.messageIntoEnvQuery('@testbot pid=1234')).to.deep.equal({
				filter: {
					package: [],
					process: [
						{ property: 'pid', value: '1234' }
					],
					system: []
				},
				query: {
					package: [],
					process: [],
					system: []
				}
			});
		});

		it('should break apart a combination of filter and query into a request', () => {
			expect(SyncBot.messageIntoEnvQuery('@testbot pid=1234 system.uptime process.uptime package.version')).to.deep.equal({
				filter: {
					package: [],
					process: [
						{ property: 'pid', value: '1234' }
					],
					system: []
				},
				query: {
					package: ['version'],
					process: ['uptime'],
					system: ['uptime']
				}
			});
		});
	});

	describe('SyncBot.envResultIntoMessage', () => {
		it('should render a simple result as a string', () => {
			const exampleResult: ProcBotEnvironmentProperties = {
				package: [],
				process: [
					{ property: 'pid', value: '1234' }
				],
				system: []
			};
			expect(SyncBot.envResultIntoMessage(exampleResult)).to.equal('process.pid=1234');
		});

		it('should render a compound result as a string', () => {
			const exampleResult: ProcBotEnvironmentProperties = {
				package: [
					{ property: 'version', value: '1.2.3' }
				],
				process: [
					{ property: 'pid', value: '1234' }
				],
				system: [
					{
						property: 'networkInterfaces',
						value: {
							lo: [
								{
									address: '127.0.0.1',
									netmask: '255.0.0.0',
									family: 'IPv4',
									mac: '00:00:00:00:00:00',
									internal: true,
									cidr: '127.0.0.1/8'
								}
							]
						}
					},
					{ property: 'uptime', value: '5678' }
				]
			};
			const expectedOutput = [
				'package.version=1.2.3',
				'process.pid=1234',
				'system.uptime=5678',
				'system.networkInterfaces=',
				'```json',
				'{ lo:',
				'   [ { address: \'127.0.0.1\',',
				'       netmask: \'255.0.0.0\',',
				'       family: \'IPv4\',',
				'       mac: \'00:00:00:00:00:00\',',
				'       internal: true,',
				'       cidr: \'127.0.0.1/8\' } ] }',
				'```'
			].join('\n');
			expect(SyncBot.envResultIntoMessage(exampleResult)).to.equal(expectedOutput);
		});
	});
});
