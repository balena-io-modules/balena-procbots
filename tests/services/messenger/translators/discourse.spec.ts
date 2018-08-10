/// <reference types="mocha" />
import { expect } from 'chai';
import * as crypto from 'crypto';
import * as _ from 'lodash';
import { BasicEventInformation } from '../../../../lib/services/messenger-types';
import { DiscourseTranslator } from '../../../../lib/services/messenger/translators/discourse';

describe('lib/services/messenger/translators/discourse.ts', () => {

	describe('DiscourseTranslator.bundleMessage', () => {
		const simpleMessage: BasicEventInformation = {
			details: {
				user: {
					handle: 'b',
				},
				message: {
					hidden: false,
					text: 'cde @test',
					time: '2018-04-16T12:45:46+00:00',
				},
				thread: {
					tags: [],
					title: 'f',
				}
			},
			current: {
				message: 'g',
				thread: 'h',
				service: 'i',
				username: 'j',
				flow: 'k',
			},
		};
		const metadataConfig = {
			baseUrl: 'http://e.com',
			publicity: {
				hidden: 'whisper',
				hiddenPreferred: 'murmur',
				shown: 'comment',
			},
			secret: 'salt',
		};
		const thread = 'l';

		it('should convert a simple message object into emit instructions', async () => {
			const emit = await DiscourseTranslator.bundleMessage(simpleMessage, thread, metadataConfig);
			const hmac = crypto.createHmac('sha256', 'salt').update('cde test').digest('hex');
			const raw = `cde @test\n[](http://e.com?hidden=comment&source=i&flow=k&thread=h&hmac=${hmac})`;
			expect(emit).to.deep.equal({
				method: ['request'],
				payload: {
					htmlVerb: 'POST',
					path: '/posts',
					body: {
						raw,
						topic_id: 'l',
						whisper: 'false',
					},
				},
			});
		});

		it('should convert a message with a funny username into emit instructions', async () => {
			const complexMessage = _.cloneDeep(simpleMessage);
			complexMessage.details.message = {
				hidden: false,
				text: 'cde @test-',
				time: '2018-04-16T12:45:46+00:00',
			};
			const emit = await DiscourseTranslator.bundleMessage(complexMessage, thread, metadataConfig);
			const hmac = crypto.createHmac('sha256', 'salt').update('cde test').digest('hex');
			const raw = `cde @_test\n[](http://e.com?hidden=comment&source=i&flow=k&thread=h&hmac=${hmac})`;
			expect(emit).to.deep.equal({
				method: ['request'],
				payload: {
					htmlVerb: 'POST',
					path: '/posts',
					body: {
						raw,
						topic_id: 'l',
						whisper: 'false',
					},
				},
			});
		});
	});

	describe('DiscourseTranslator.convertUsernameToGeneric', () => {
		it('should remove a leading underscore from a string and add a hyphen to the end', () => {
			expect(DiscourseTranslator.convertUsernameToGeneric('_test_user')).to.equal('test_user-');
		});

		it('should leave a string unmodified if it has no leading underscore', () => {
			expect(DiscourseTranslator.convertUsernameToGeneric('test_user')).to.equal('test_user');
		});
	});

	describe('DiscourseTranslator.convertUsernameToDiscourse', () => {
		it('should remove a a trailing hyphen from a string and add an underscore to the beginning', () => {
			expect(DiscourseTranslator.convertUsernameToDiscourse('test_user-')).to.equal('_test_user');
		});

		it('should leave a string unmodified if it has no trailing hyphen', () => {
			expect(DiscourseTranslator.convertUsernameToDiscourse('test_user')).to.equal('test_user');
		});
	});

	describe('DiscourseTranslator.reverseEngineerComment', () => {
		it('should expand em and en dashes', () => {
			const messageWithDashes = {
				id: 'duff',
				topic_id: 'duff',
				user_id: 'duff',
				username: 'duff',
				blurb: 'duff',
				cooked: 'h:- n:– m:—',
			};
			expect(DiscourseTranslator.reverseEngineerComment(messageWithDashes)).to.equal('h:- n:-- m:---');
		});

		it('should squash ampersands back down', () => {
			const messageWithAmp = {
				id: 'duff',
				topic_id: 'duff',
				user_id: 'duff',
				username: 'duff',
				blurb: 'duff',
				cooked: 'bits &amp; bobs',
			};
			expect(DiscourseTranslator.reverseEngineerComment(messageWithAmp)).to.equal('bits & bobs');
		});
	});
});
