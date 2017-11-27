/// <reference types="mocha" />
import { expect } from 'chai';

import { TranslatorScaffold } from '../../../../lib/services/messenger/translators/translator-scaffold';
import { MetadataEncoding } from '../../../../lib/services/messenger/translators/translator-scaffold';

describe('lib/services/messenger/translators/translator-scaffold.ts', () => {
	process.env.MESSAGE_TRANSLATOR_ANCHOR_BASE_URL = 'http://example.com';
	process.env.MESSAGE_TRANSLATOR_PRIVACY_INDICATORS = JSON.stringify({
		hidden: {
			word: 'whisper',
			char: '~'
		},
		shown: {
			word: 'comment',
			char: '%',
		}
	});

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

	describe('TranslatorScaffold.stringifyMetadata', () => {
		const exampleMessage = {
			details: {
				genesis: 'a',
				handle: 'b',
				hidden: true,
				tags: [],
				text: 'c',
				title: 'd',
			},
			source: {
				message: 'e',
				thread: 'f',
				service: 'g',
				username: 'h',
				flow: 'i',
			},
		};

		it('should encode metadata into an invisible link markdown string', () => {
			const encodedMetadata = TranslatorScaffold.stringifyMetadata(
				exampleMessage,
				MetadataEncoding.HiddenMD,
			);
			expect(encodedMetadata).to.equal('[](http://example.com?hidden=whisper&source=g&thread=f)');
		});

		it('should encode metadata into an invisible link html string', () => {
			const encodedMetadata = TranslatorScaffold.stringifyMetadata(
				exampleMessage,
				MetadataEncoding.HiddenHTML,
			);
			expect(encodedMetadata).to.equal('<a href="http://example.com?hidden=whisper&source=g&thread=f"></a>');
		});
	});

	describe('TranslatorScaffold.extractMetadata', () => {
		it('should extract metadata from a markdown-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'h[](http://example.com?hidden=whisper&source=g&thread=i)',
				MetadataEncoding.HiddenMD,
			);
			expect(extractedMetadata).to.deep.equal({content: 'h', hidden: true, genesis: 'g', thread: 'i'});
		});

		it('should extract metadata from a html-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'h<a href="http://example.com?hidden=whisper&source=g&thread=i"></a>',
				MetadataEncoding.HiddenHTML,
			);
			expect(extractedMetadata).to.deep.equal({content: 'h', hidden: true, genesis: 'g', thread: 'i'});
		});

		it('should not extract metadata from an html-in-qouted-text string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'<div>Their reply.</div><div>h<a href="http://example.com?hidden=whisper&source=g&thread=i"></a></div>',
				MetadataEncoding.HiddenHTML,
			);
			expect(extractedMetadata).to.deep.equal({
				content: '<div>Their reply.</div><div>h<a href="http://example.com?hidden=whisper&source=g&thread=i"></a></div>',
				hidden: true,
				genesis: null,
				thread: null,
			});
		});
	});

	describe('TranslatorScaffold.metadataByRegex', () => {
		it('should find metadata matches in a string based on a provided regex', () => {
			const extractedMetadata = TranslatorScaffold.metadataByRegex(
				'blah,comment,e,d',
				/,(\w*),(\w*),(\w*)$/,
			);
			expect(extractedMetadata).to.deep.equal({content: 'blah', hidden: false, genesis: 'e', thread: 'd'});
		});
	});
});
