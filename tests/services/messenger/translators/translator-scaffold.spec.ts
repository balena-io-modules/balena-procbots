/// <reference types="mocha" />
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import {
	MetadataEncoding,
	TranslatorScaffold,
} from '../../../../lib/services/messenger/translators/translator-scaffold';

describe('lib/services/messenger/translators/translator-scaffold.ts', () => {
	const exampleConfig = {
		baseUrl: 'http://e.com',
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

	describe('TranslatorScaffold.extractSource', () => {
		it('should find the correct "Connects to" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractSource(
				'foo',
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'[Connects to foo thread abc]',
					'[Connects to bar thread def]',
				],
				exampleConfig,
			);
			expect(threadId).to.deep.equal({thread: 'abc'});
		});

		it('should find the correct "Mirrored" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractSource(
				'foo',
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'This is mirrored in [bar thread jkl]',
					'This is mirrored in [foo thread ghi]',
				],
				exampleConfig,
			);
			expect(threadId).to.deep.equal({thread: 'ghi'});
		});

		it('should find the correct "Atomic" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractSource(
				'm',
				[
					'm, blah, test, discourse and thread.[](http://e.com?hidden=whisper&source=m&flow=n&thread=o)',
					'This is mirrored in [bar thread pqr]',
					'This is mirrored in [foo thread stu]',
				],
				exampleConfig,
				MetadataEncoding.HiddenMD,
			);
			expect(threadId).to.deep.equal({flow: 'n', service: 'm', thread: 'o'});
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
			expect(encodedMetadata).to.equal('[](http://e.com?hidden=whisper&source=g&flow=i&thread=f)');
		});

		it('should encode metadata into an invisible link html string', () => {
			const encodedMetadata = TranslatorScaffold.stringifyMetadata(
				exampleMessage,
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			expect(encodedMetadata).to.equal('<a href="http://e.com?hidden=whisper&source=g&flow=i&thread=f"></a>');
		});
	});

	describe('TranslatorScaffold.extractMetadata', () => {
		it('should extract metadata from a markdown-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'h[](http://e.com?hidden=whisper&source=g&flow=j&thread=i)',
				MetadataEncoding.HiddenMD,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal({content: 'h', hidden: true, genesis: 'g', flow: 'j', thread: 'i'});
		});

		it('should extract metadata from a html-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'h<a href="http://e.com?hidden=whisper&source=g&flow=j&thread=i"></a>',
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal({content: 'h', hidden: true, genesis: 'g', flow: 'j', thread: 'i'});
		});

		it('should not extract metadata from an html-in-qouted-text string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				'<div>Their reply.</div><div>h<a href="http://e.com?hidden=whisper&source=g&flow=j&thread=i"></a></div>',
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal({
				content: '<div>Their reply.</div><div>h<a href="http://e.com?hidden=whisper&source=g&flow=j&thread=i"></a></div>',
				hidden: true,
				genesis: null,
				flow: null,
				thread: null,
			});
		});
	});

	describe('TranslatorScaffold.metadataByRegex', () => {
		it('should find metadata matches in a string based on a provided regex', () => {
			const extractedMetadata = TranslatorScaffold.metadataByRegex(
				'blah,comment,e,d,f',
				/,(\w*),(\w*),(\w*),(\w*)$/,
				exampleConfig.publicity,
			);
			expect(extractedMetadata).to.deep.equal({content: 'blah', hidden: false, genesis: 'e', flow: 'd', thread: 'f'});
		});
	});
});
