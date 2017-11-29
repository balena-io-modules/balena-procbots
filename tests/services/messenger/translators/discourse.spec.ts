/// <reference types="mocha" />
import { expect } from 'chai';

import { DiscourseTranslator } from '../../../../lib/services/messenger/translators/discourse';

describe('lib/services/messenger/translators/discourse.ts', () => {

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
				blurb: 'duff',
				cooked: 'h:- n:– m:—',
			};
			expect(DiscourseTranslator.reverseEngineerComment(messageWithDashes)).to.equal('h:- n:-- m:---');
		});

		it('should squash ampersands back down', () => {
			const messageWithAmp = {
				id: 'duff',
				topic_id: 'duff',
				blurb: 'duff',
				cooked: 'bits &amp; bobs',
			};
			expect(DiscourseTranslator.reverseEngineerComment(messageWithAmp)).to.equal('bits & bobs');
		});
	});
});
