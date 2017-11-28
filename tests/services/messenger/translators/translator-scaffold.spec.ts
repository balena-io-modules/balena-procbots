/// <reference types="mocha" />
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import { TranslatorScaffold } from '../../../../lib/services/messenger/translators/translator-scaffold';
import { MetadataEncoding } from '../../../../lib/services/messenger/translators/translator-scaffold';

describe('lib/services/messenger/translators/translator-scaffold.ts', () => {
	const exampleConfig = {
		baseUrl: 'http://example.com',
		publicity: {
			hidden: {
				word: 'whisper',
				char: '~',
			},
			shown: {
				word: 'comment',
				char: '%',
			},
		},
	};

	describe('TranslatorScaffold.extractThreadId', () => {
		it('should find the correct "Connects to" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractThreadId(
				'foo',
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'[Connects to foo thread abc]',
					'[Connects to bar thread def]',
				],
				exampleConfig,
			);
			expect(threadId).to.eventually.deep.equal({thread: 'abc'});
		});

		it('should find the correct "Mirrored" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractThreadId(
				'foo',
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'This is mirrored in [bar thread jkl]',
					'This is mirrored in [foo thread ghi]',
				],
				exampleConfig,
			);
			expect(threadId).to.eventually.deep.equal({thread: 'ghi'});
		});

		it('should find the correct "Atomic" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractThreadId(
				'foo',
				[
					'A message.[](http://example.com?hidden=comment&source=foo&thread=stu)',
					'This is mirrored in [bar thread mno]',
					'This is mirrored in [foo thread pqr]',
				],
				exampleConfig,
				MetadataEncoding.HiddenMD,
			);
			expect(threadId).to.eventually.deep.equal({thread: 'stu'});
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
				exampleConfig,
			);
			expect(encodedMetadata).to.equal('[](http://example.com?hidden=whisper&source=g&thread=f)');
		});

		it('should encode metadata into an invisible link html string', () => {
			const encodedMetadata = TranslatorScaffold.stringifyMetadata(
				exampleMessage,
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			expect(encodedMetadata).to.equal('<a href="http://example.com?hidden=whisper&source=g&thread=f"></a>');
		});
	});

	describe('TranslatorScaffold.extractMetadata', () => {
		it('should extract metadata from a markdown-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'h[](http://example.com?hidden=whisper&source=g&thread=i)',
				MetadataEncoding.HiddenMD,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal({content: 'h', hidden: true, genesis: 'g', thread: 'i'});
		});

		it('should extract metadata from a html-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'h<a href="http://example.com?hidden=whisper&source=g&thread=i"></a>',
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal({content: 'h', hidden: true, genesis: 'g', thread: 'i'});
		});

		it('should not extract metadata from an html-in-qouted-text string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'<div>Their reply.</div><div>h<a href="http://example.com?hidden=whisper&source=g&thread=i"></a></div>',
				MetadataEncoding.HiddenHTML,
				exampleConfig,
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
				exampleConfig.publicity,
			);
			expect(extractedMetadata).to.deep.equal({content: 'blah', hidden: false, genesis: 'e', thread: 'd'});
		});
	});
});
