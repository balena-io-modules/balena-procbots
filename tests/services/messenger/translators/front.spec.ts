/// <reference types="mocha" />
import { expect } from 'chai';

import * as Bluebird from 'bluebird';
import * as FS from 'fs';
import { MessengerAction, TransmitInformation } from '../../../../lib/services/messenger-types';
import { FrontTranslator } from '../../../../lib/services/messenger/translators/front';

const fsReadFile: (filename: string, options?: any) => Bluebird<Buffer | string> = Bluebird.promisify(FS.readFile);

describe('lib/services/messenger/translators/front.ts', () => {
	describe('FrontTranslator.convertReadConnectionResponse', () => {
		it('should convert a list of messages into an id', async () => {
			const config = {
				baseUrl: 'http://resin.io',
				publicity: {
					hidden: 'whisper',
					shown: 'reply',
				}
			};
			const target = {
				action: 1,
				source: {
					service: 'flowdock',
					username: 'duff',
					message: 'duff',
					thread: 'duff',
					flow: 'duff',
				},
				target: {
					service: 'duff',
					username: 'duff',
					flow: 'duff',
				},
				details: {
					genesis: 'duff',
					handle: 'duff',
					hidden: false,
					tags: [],
					text: 'duff',
					title: 'duff',
				}
			};
			const messages = await fsReadFile('tests/services/messenger/translators/example-front-thread.json', 'utf8');
			const messageObject = JSON.parse(messages.toString());
			const converted = await FrontTranslator.convertReadConnectionResponse(config, target, messageObject);
			expect(converted.thread).to.equal('rightId');
		});
	});

	describe('FrontTranslator.convertUsernameToGeneric', () => {
		it('should convert a funny username into generic form', () => {
			expect(FrontTranslator.convertUsernameToGeneric('test_this')).to.equal('test-this');
		});

		it('should leave a normal username alone', () => {
			expect(FrontTranslator.convertUsernameToGeneric('test')).to.equal('test');
		});
	});

	describe('FrontTranslator.convertUsernameToFront', () => {
		it('should convert a funny username into Front form', () => {
			expect(FrontTranslator.convertUsernameToFront('test-this')).to.equal('test_this');
		});

		it('should leave a normal username alone', () => {
			expect(FrontTranslator.convertUsernameToFront('test')).to.equal('test');
		});
	});

	describe('FrontTranslator.archiveThreadIntoEmit', () => {
		const exampleDetails: TransmitInformation = {
			action: MessengerAction.ArchiveThread,
			details: {
				genesis: 'a',
				handle: 'b',
				hidden: false,
				tags: [],
				text: 'cde @test',
				title: 'f',
			},
			source: {
				message: 'g',
				thread: 'h',
				service: 'i',
				username: 'j',
				flow: 'k',
			},
			target: {
				service: 'l',
				username: 'm',
				flow: 'n',
				thread: 'o',
			}
		};
		it('should convert a request to archive into proper instructions', async () => {
			const emitInstructions = await FrontTranslator.archiveThreadIntoEmit(exampleDetails);
			expect(emitInstructions).to.deep.equal({
				method: [
					'conversation',
					'update',
				],
				payload: {
					conversation_id: 'o',
					status: 'archived',
				},
			});
		});
	});
});
