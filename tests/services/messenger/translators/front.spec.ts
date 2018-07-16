/// <reference types="mocha" />
import { expect } from 'chai';

import * as Bluebird from 'bluebird';
import * as FS from 'fs';
import { BasicMessageInformation, MessengerAction, TransmitInformation } from '../../../../lib/services/messenger-types';
import { FrontTranslator } from '../../../../lib/services/messenger/translators/front';
import { MetadataConfiguration } from '../../../../lib/services/messenger/translators/translator-types';

const fsReadFile: (filename: string, options?: any) => Bluebird<Buffer | string> = Bluebird.promisify(FS.readFile);

describe('lib/services/messenger/translators/front.ts', () => {
	describe('FrontTranslator.extractReply', () => {
		it('should leave the content from a simple email alone', () => {
			const email = [
				'test this',
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal(email);
		});
		it('should extract the most recent reply from a more complex email', () => {
			// This a trimmed version of https://app.frontapp.com/open/cnv_lmlnb5
			const email = [
				'Thank you, I will check it out.',
				'',
				'On Mon, 14 May 2018 at 16:42 Someone Great <support@resin.io> wrote:',
				'',
				'> Hi,',
				'>',
				'>The thing, it be done.',
				'',
				'Best Regards,',
				'The Customer',
			].join('\n');
			const newContent = [
				'Thank you, I will check it out.',
				'',
				'Best Regards,',
				'The Customer',
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal(newContent);
		});
		it('should leave content from ZenDesk alone', () => {
			// This is a trimmed version of https://app.frontapp.com/open/cnv_s3sqkb
			const email = [
				'Thanks',
				'some details',
				'[View in Zendesk](https://resin.zendesk.com/agent/tickets/123) -- https://resin.zendesk.com/agent/tickets/123'
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal(email);
		});
		it('should leave content from Intercom alone', () => {
			// This is a trimmed version of https://app.frontapp.com/open/cnv_s3sqkb
			const email = [
				'What\'s most odd to us right now is some stuff',
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal(email);
		});
		// Edge cases taken from https://www.npmjs.com/package/emailreplyparser
		it('should not fail catastrophically when a customer uses Latin (or any other foreign language)', () => {
			const email = [
				'gratias',
				'',
				'Die Lunae, MMXVIII May XIV, scripsit aliquem magnum:',
				'> Salve',
			].join('\n');
			const acceptableContent = [
				'gratias',
				'',
				'Die Lunae, MMXVIII May XIV, scripsit aliquem magnum:',
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal(acceptableContent);
		});
		it('should not fail catastrophically when a citation breaks the /^on.*wrote:$/im convention', () => {
			const email = [
				'thanks',
				'',
				'On date, author',
				'wrote:',
				'> this',
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal('thanks');
		});
		it('should not fail catastrophically when a signature is just a follow on block', () => {
			const email = [
				'Hello',
				'',
				'Mr Rick Olson',
				'Galactic President Superstar Mc Awesomeville',
				'GitHub',
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal(email);
		});
		it('should not fail catastrophically when quoted text uses strange quoting', () => {
			const email = [
				'Hello',
				'',
				'--',
				'Rick',
				'________________________________________',
				'From: Bob [reply@reply.github.com]',
				'Sent: Monday, March 14, 2011 6:16 PM',
				'To: Rick',
			].join('\n');
			expect(FrontTranslator.extractReply(email)).to.equal(email);
		});
	});

	describe('FrontTranslator.convertReadConnectionResponse', () => {
		it('should convert a list of messages into an id', async () => {
			const config: MetadataConfiguration = {
				baseUrl: 'http://resin.io',
				publicity: {
					hidden: 'whisper',
					hiddenPreferred: 'murmur',
					shown: 'reply',
				},
				secret: 'salt',
			};
			const target: BasicMessageInformation = {
				current: {
					service: 'flowdock',
					username: 'duff',
					message: 'duff',
					thread: 'duff',
					flow: 'public-s-premium',
				},
				details: {
					handle: 'duff',
					hidden: false,
					tags: [],
					text: 'duff',
					time: '2018-04-16T12:45:46+00:00',
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
				handle: 'b',
				hidden: false,
				tags: [],
				text: 'cde @test',
				time: '2018-04-16T12:45:46+00:00',
				title: 'f',
			},
			current: {
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
