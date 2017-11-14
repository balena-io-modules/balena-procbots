/// <reference types="mocha" />
import { expect } from 'chai';

import { TranslatorScaffold } from '../../../../lib/services/messenger/translators/translator-scaffold';

describe('lib/services/messenger/translators/translator-scaffold.ts', () => {

	describe('TranslatorScaffold.extractThreadId', () => {
		it('should find the correct "Connects to" style id from an array of message strings', async () => {
			const threadId = await TranslatorScaffold.extractThreadId(
				'foo',
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'[Connects to foo thread abc]',
					'[Connects to bar thread def]',
				],
			);
			expect(threadId).to.deep.equal({thread: 'abc'});
		});

		it('should find the correct "Mirrored" style id from an array of message strings', async () => {
			const threadId = await TranslatorScaffold.extractThreadId(
				'foo',
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'This is mirrored in [bar thread jkl]',
					'This is mirrored in [foo thread ghi]',
				],
			);
			expect(threadId).to.deep.equal({thread: 'ghi'});
		});
	});
});
