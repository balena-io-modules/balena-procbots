/// <reference types="mocha" />
import { expect } from 'chai';

import { FrontTranslator } from '../../../../lib/services/messenger/translators/front';

describe('lib/services/messenger/translators/front.ts', () => {

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
});
