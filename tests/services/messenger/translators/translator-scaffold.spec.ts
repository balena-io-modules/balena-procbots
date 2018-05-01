/// <reference types="mocha" />
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);
const expect = chai.expect;

import * as crypto from 'crypto';
import { BasicMessageInformation } from '../../../../lib/services/messenger-types';
import {
	MetadataEncoding,
	TranslatorScaffold,
} from '../../../../lib/services/messenger/translators/translator-scaffold';
import { MetadataConfiguration } from '../../../../lib/services/messenger/translators/translator-types';

describe('lib/services/messenger/translators/translator-scaffold.ts', () => {
	const exampleConfig: MetadataConfiguration = {
		baseUrl: 'http://e.com',
		publicity: {
			hidden: 'whisper',
			hiddenPreferred: 'murmur',
			shown: 'reply',
		},
		secret: 'salt',
	};

	describe('TranslatorScaffold.convertPings', () => {
		const converter = (username: string) => { return `**${username}**`; };

		it('should leave messages without usernames alone', () => {
			expect(TranslatorScaffold.convertPings('test this', converter)).to.equal('test this');
		});

		it('should convert usernames according to the converter', () => {
			expect(TranslatorScaffold.convertPings('test @this too', converter)).to.equal('test @**this** too');
		});

		it('should leave email address domains unconverted', () => {
			expect(TranslatorScaffold.convertPings('test this@example.com', converter)).to.equal('test this@example.com');
		});

		it('should convert pings in brackets', () => {
			expect(TranslatorScaffold.convertPings('test (@this)', converter)).to.equal('test (@**this**)');
		});
	});

	describe('TranslatorScaffold.extractSource', () => {
		it('should find the correct "Connects to" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractSource(
				{
					service: 'foo',
					flow: 'baz',
					message: 'duff',
					thread: 'duff',
					username: 'duff',
				},
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
				{
					service: 'foo',
					flow: 'baz',
					message: 'duff',
					thread: 'duff',
					username: 'duff',
				},
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'This is mirrored in [bar thread jkl]',
					'This is mirrored in [foo thread ghi]',
				],
				exampleConfig,
			);
			expect(threadId).to.deep.equal({thread: 'ghi'});
		});

		it('should find the correct "Flow cited" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractSource(
				{
					service: 'foo',
					flow: 'baz',
					message: 'duff',
					thread: 'duff',
					username: 'duff',
				},
				[
					'A message that mentions blah, foo, bar, test, discourse and thread.',
					'This is mirrored in [bar baz thread jkl]',
					'This is mirrored in [foo ram thread mno]',
					'This is mirrored in [foo baz thread ghi]',
					'This is mirrored in [foo ewe thread pqr]',
				],
				exampleConfig,
			);
			expect(threadId).to.deep.equal({thread: 'ghi'});
		});

		it('should find the correct "Atomic" style id from an array of message strings', () => {
			const threadId = TranslatorScaffold.extractSource(
				{
					service: 'm',
					flow: 'n',
					message: 'duff',
					thread: 'duff',
					username: 'duff',
				},
				[
					'm, blah, test, discourse and thread.[](http://e.com?hidden=whisper&source=m&flow=v&thread=o)',
					'm, blah, test, discourse and thread.[](http://e.com?hidden=whisper&source=m&flow=n&thread=o)',
					'm, blah, test, discourse and thread.[](http://e.com?hidden=whisper&source=m&flow=w&thread=o)',
					'This is mirrored in [bar thread pqr]',
					'This is mirrored in [foo thread stu]',
				],
				exampleConfig,
				MetadataEncoding.HiddenMD,
			);
			expect(threadId).to.deep.equal({flow: 'n', service: 'm', thread: 'o'});
		});
	});

	describe('TranslatorScaffold.extractWords', () => {
		it('should find the words in a simple message', () => {
			expect(TranslatorScaffold.extractWords('test this')).to.deep.equal(['test', 'this']);
		});

		it('should find the words in a message that contains hyphens and underscores', () => {
			expect(TranslatorScaffold.extractWords('test-this_')).to.deep.equal(['test', 'this']);
		});

		it('should remove grammar, including upper case', () => {
			expect(TranslatorScaffold.extractWords('Test this.')).to.deep.equal(['test', 'this']);
		});

		it('should remove simple html tags', () => {
			expect(TranslatorScaffold.extractWords('<p>test this</p>')).to.deep.equal(['test', 'this']);
		});

		it('should remove complex html tags', () => {
			expect(TranslatorScaffold.extractWords('<a href="blah">test<br/>this</a>')).to.deep.equal(['test', 'this']);
		});

		it('should ignore invisible html', () => {
			expect(TranslatorScaffold.extractWords('test this<a href="blah"></a>')).to.deep.equal(['test', 'this']);
		});

		it('should remove simple markdown', () => {
			expect(TranslatorScaffold.extractWords('**test this**')).to.deep.equal(['test', 'this']);
		});

		it('should remove complex markdown', () => {
			expect(TranslatorScaffold.extractWords('[test](blah)\n\n* this')).to.deep.equal(['test', 'this']);
		});

		it('should ignore invisible markdown', () => {
			expect(TranslatorScaffold.extractWords('test this\n\n[](blah)')).to.deep.equal(['test', 'this']);
		});

		it('should ignore emoji, in both character and :colon: format', () => {
			expect(TranslatorScaffold.extractWords('test :smile: this')).to.deep.equal(['test', 'this']);
			expect(TranslatorScaffold.extractWords('test :face_with_cowboy_hat: this')).to.deep.equal(['test', 'this']);
			expect(TranslatorScaffold.extractWords('test 😄 this')).to.deep.equal(['test', 'this']);
			expect(TranslatorScaffold.extractWords('test😄this')).to.deep.equal(['test', 'this']);
		});

		it('should correctly parse citations', () => {
			const citation = 'Test <test@example.com>';
			const expectedWords = ['test', 'test', 'example', 'com'];
			expect(TranslatorScaffold.extractWords(citation)).to.deep.equal(expectedWords);
		});
	});

	describe('TranslatorScaffold.stringifyMetadata', () => {
		const hmac = crypto.createHmac('sha256', 'salt').update('c').digest('hex');
		const exampleMessage: BasicMessageInformation = {
			details: {
				handle: 'b',
				hidden: true,
				tags: [],
				text: 'c',
				time: '2018-04-16T12:45:46+00:00',
				title: 'd',
			},
			current: {
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
			const expectedString = `[](http://e.com?hidden=whisper&source=g&flow=i&thread=f&hmac=${hmac})`;
			expect(encodedMetadata).to.equal(expectedString);
		});

		it('should encode metadata into an invisible link html string', () => {
			const encodedMetadata = TranslatorScaffold.stringifyMetadata(
				exampleMessage,
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			const expectedString = `<a href="http://e.com?hidden=whisper&source=g&flow=i&thread=f&hmac=${hmac}"></a>`;
			expect(encodedMetadata).to.equal(expectedString);
		});
	});

	describe('TranslatorScaffold.idToSlugPart', () => {
		it('should leave an entirely lower case ID alone', () => {
			expect(TranslatorScaffold.idToSlugPart('thisid')).to.equal('thisid');
		});
		it('should snake case a camel case ID', () => {
			expect(TranslatorScaffold.idToSlugPart('thisId')).to.equal('this-id');
		});
		it('should escape special characters as their char code', () => {
			expect(TranslatorScaffold.idToSlugPart('this-id')).to.equal('this-45-id');
		});
		it('should combine escape techniques', () => {
			expect(TranslatorScaffold.idToSlugPart('this-Id')).to.equal('this-45--id');
		});
	});

	describe('TranslatorScaffold.slugPartToId', () => {
		it('should leave an entirely lower case ID alone', () => {
			expect(TranslatorScaffold.slugPartToId('thisid')).to.equal('thisid');
		});
		it('should camel case a snake case ID', () => {
			expect(TranslatorScaffold.slugPartToId('this-id')).to.equal('thisId');
		});
		it('should resolve special characters from their char code', () => {
			expect(TranslatorScaffold.slugPartToId('this-45-id')).to.equal('this-id');
		});
		it('should combine escape techniques', () => {
			expect(TranslatorScaffold.slugPartToId('this-45--id')).to.equal('this-Id');
		});
	});

	const simpleIds = {
		service: 'someservice',
		flow: 'someflow',
		thread: 'somethread',
	};
	const simpleSlug = 'someservice--00--thread--00--someflow--00--somethread';
	const complexIds = {
		service: 'flowdock',
		flow: 'p/testing',
		thread: '_t-T0',
	};
	const complexSlug = 'flowdock--00--thread--00--p-47-testing--00---95-t-45--t0';

	describe('TranslatorScaffold.idsToSlug', () => {
		it('should translate a simple id', () => {
			expect(TranslatorScaffold.idsToSlug(simpleIds)).to.equal(simpleSlug);
		});
		it('should translate a complex id', () => {
			expect(TranslatorScaffold.idsToSlug(complexIds)).to.equal(complexSlug);
		});
	});

	describe('TranslatorScaffold.slugToIds', () => {
		it('should translate a simple slug', () => {
			expect(TranslatorScaffold.slugToIds(simpleSlug)).to.deep.equal(simpleIds);
		});
		it('should translate a complex slug', () => {
			expect(TranslatorScaffold.slugToIds(complexSlug)).to.deep.equal(complexIds);
		});
	});

	describe('TranslatorScaffold.signText', () => {
		const hmac = crypto.createHmac('sha256', 'salt').update('h').digest('hex');

		it('should correctly hash a provided object', () => {
			const hash = TranslatorScaffold.signText('h', exampleConfig.secret);
			expect(hash).to.equal(hmac);
		});
	});

	describe('TranslatorScaffold.extractMetadata', () => {
		const hmac = crypto.createHmac('sha256', 'salt').update('h').digest('hex');
		const expectedObject = { content: 'h', hidden: true, service: 'g', flow: 'j', thread: 'i', hmac };

		it('should extract metadata from a markdown-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				`h[](http://e.com?hidden=whisper&source=g&flow=j&thread=i&hmac=${hmac})`,
				MetadataEncoding.HiddenMD,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal(expectedObject);
		});

		it('should extract metadata from a html-at-end string', () => {
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				`h<a href="http://e.com?hidden=whisper&source=g&flow=j&thread=i&hmac=${hmac}"></a>`,
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal(expectedObject);
		});

		it('should not extract metadata from an html-in-qouted-text string', () => {
			const copiedMessage = `h<a href="http://e.com?hidden=whisper&source=g&flow=j&thread=i&hmac=${hmac}"></a>`;
			const extractedMetadata = TranslatorScaffold.extractMetadata(
				`<div>Their reply.</div><div>${copiedMessage}</div><div>footer</div>`,
				MetadataEncoding.HiddenHTML,
				exampleConfig,
			);
			expect(extractedMetadata).to.deep.equal({
				content: `<div>Their reply.</div><div>${copiedMessage}</div><div>footer</div>`,
				hidden: true,
				service: null,
				hmac: null,
				flow: null,
				thread: null,
			});
		});
	});

	describe('TranslatorScaffold.metadataByRegex', () => {
		it('should find metadata matches in a string based on a provided regex', () => {
			const extractedMetadata = TranslatorScaffold.metadataByRegex(
				'blah,reply,e,d,f,g',
				/,(\w*),(\w*),(\w*),(\w*),(\w*)$/,
				exampleConfig.publicity,
			);
			const expectedOutput = {content: 'blah', hidden: false, service: 'e', flow: 'd', thread: 'f', hmac: 'g'};
			expect(extractedMetadata).to.deep.equal(expectedOutput);
		});
	});
});
