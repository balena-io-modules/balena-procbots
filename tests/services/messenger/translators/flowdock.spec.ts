/// <reference types="mocha" />
import { expect } from 'chai';

import * as crypto from 'crypto';
import { FlowdockTranslator } from '../../../../lib/services/messenger/translators/flowdock';
import {
	MetadataEncoding,
	TranslatorScaffold,
} from '../../../../lib/services/messenger/translators/translator-scaffold';
import { MetadataConfiguration } from '../../../../lib/services/messenger/translators/translator-types';

describe('lib/services/messenger/translators/flowdock.ts', () => {
	const config: MetadataConfiguration = {
		baseUrl: 'http://e.com',
		publicity: {
			hidden: 'whisper',
			hiddenPreferred: 'murmur',
			shown: 'reply',
		},
		secret: 'salt',
	};

	describe('FlowdockTranslator.createFormattedText', () => {
		it('should format a multi-part message into one string', () => {
			const options = {
				header: 'top',
				metadata: 'stuff',
				footer: 'bottom',
				tags: ['tag'],
			};
			const expected = [
				'top',
				'--',
				'#tag',
				'middle',
				'bottom',
				'stuff',
			].join('\n');
			expect(FlowdockTranslator.createFormattedText('middle', options, config)).to.equal(expected);
		});

		it('should inject line prefixes into simple multi-line strings', () => {
			const multiLineString = [
				'first line.',
				'second line.',
				'third line.',
			].join('\n');
			const options = {
				prefix: '% '
			};
			const expected = [
				'% first line.',
				'second line.',
				'third line.',
			].join('\n');
			expect(FlowdockTranslator.createFormattedText(multiLineString, options, config)).to.equal(expected);
		});

		it('should inject line prefixes into a compound string', () => {
			const multiLineString = [
				'first line.',
				'second line.',
				'third line.',
			].join('\n');
			const options = {
				prefix: '% ',
				header: 'top',
				footer: 'bottom',
				metadata: 'stuff',
			};
			const expected = [
				'% top',
				'--',
				'first line.',
				'second line.',
				'third line.',
				'bottom',
				'stuff',
			].join('\n');
			expect(FlowdockTranslator.createFormattedText(multiLineString, options, config)).to.equal(expected);
		});

		it('should format a really long string into one trimmed string', () => {
			const veryLongString = [
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut',
				'labore et dolore magna aliqua.',
			].join('\n');
			const lengthLimit = 128;
			const options = {
				lengthLimit,
				prefix: '% ',
				header: 'De finibus bonorum et malorum',
				footer: '- Cicero',
			};
			const longString = [
				'% De finibus bonorum et malorum',
				'--',
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do',
				'`… about 51% shown.`',
				`- Cicero`,
			].join('\n');
			const snippedString = FlowdockTranslator.createFormattedText(veryLongString, options, config);
			expect(snippedString.length).to.equal(lengthLimit);
			expect(snippedString).to.equal(longString);
		});

		it('should replace signature on really long strings', () => {
			const veryLongString = [
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut',
				'labore et dolore magna aliqua.',
			].join('\n');
			const lengthLimit = 192;
			const hmac = crypto.createHmac('sha256', 'salt').update('h').digest('hex');
			const metadata = `http://e.com?hmac=${hmac}`;
			expect(metadata).to.equal('http://e.com?hmac=26e52d694bce4b1f7cb5645c59910c75c9f218bd4a1e568600f678d537d0f14d');
			const options = {
				lengthLimit,
				prefix: '% ',
				header: 'De finibus bonorum et malorum',
				metadata
			};
			const longString = [
				'% De finibus bonorum et malorum',
				'--',
				'Lorem ipsum dolor sit amet, consectetur adipiscing el',
				'`… about 43% shown.`',
				'http://e.com?hmac=435c282780572c656f255b4bdd669c9568bec32bc8ef2931cd830e45b1705a58',
			].join('\n');
			const snippedString = FlowdockTranslator.createFormattedText(veryLongString, options, config);
			expect(snippedString.length).to.equal(lengthLimit);
			expect(snippedString).to.equal(longString);
		});

		it('should format thread links as correct MD headers', () => {
			const options = {
				prefix: '% ',
				header: 'top',
				url: 'www.example.com'
			};
			const expected = [
				'% [top](www.example.com)',
				'--',
				'body',
			].join('\n');
			expect(FlowdockTranslator.createFormattedText('body', options, config)).to.equal(expected);
		});
	});

	describe('FlowdockTranslator.extractMetadata', () => {
		it('should find metadata in a synchronised (hiddenMD) message', () => {
			const hmac = crypto.createHmac('sha256', 'salt').update('h').digest('hex');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				`h[](http://e.com?hidden=whisper&source=g&flow=j&thread=i&hmac=${hmac})`,
				MetadataEncoding.Flowdock,
				config,
			);
			const expectedObject = {content: 'h', hidden: true, service: 'g', flow: 'j', thread: 'i', hmac, title: undefined};
			expect(extractedMetadata).to.deep.equal(expectedObject);
		});

		it('should return private for a message with no funny business', () => {
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				'h',
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.hidden).to.equal(true);
		});

		it('should return public and strip syntax for a message with the magic syntax', () => {
			const message = [
				'% h',
				'i',
			].join('\n');
			const expected = [
				'h',
				'i',
			].join('\n');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				message,
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.hidden).to.equal(false);
			expect(extractedMetadata.content).to.equal(expected);
		});

		it('should return private for a message that has lines before the magic syntax', () => {
			const message = [
				'',
				'>i',
			].join('\n');
			const expected = [
				'>i',
			].join('\n');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				message,
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.hidden).to.equal(true);
			expect(extractedMetadata.content).to.equal(expected);
		});

		it('should trust metadata over magic syntax', () => {
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				'>h[](http://e.com?hidden=whisper&source=g&flow=j&thread=i)',
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.hidden).to.equal(true);
		});

		it('should return all paragraphs of a multi paragraph message', () => {
			const message = [
				'title',
				'',
				'body',
			].join('\n');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				message,
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.content).to.equal(message);
		});

		it('should split title and body of a titled message', () => {
			const message = [
				'title',
				'==',
				'',
				'body',
			].join('\n');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				message,
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.title).to.equal('title');
			expect(extractedMetadata.content).to.equal('body');
		});

		it('should return all paragraphs of a quoted message', () => {
			const message = [
				'% body',
				'',
				'also body',
			].join('\n');
			const expectedResponse = [
				'body',
				'',
				'also body',
			].join('\n');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				message,
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.content).to.equal(expectedResponse);
			expect(extractedMetadata.hidden).to.equal(false);
		});

		it('should split title and body of a titled and formatted message', () => {
			const message = [
				'% [title](www.example.com)',
				'--',
				'body',
			].join('\n');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				message,
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.title).to.equal('title');
			expect(extractedMetadata.content).to.equal('body');
		});

		it('should deal with quote marks', () => {
			const message = [
				'% "title"',
				'--',
				'"body"',
			].join('\n');
			const extractedMetadata = FlowdockTranslator.extractMetadata(
				message,
				MetadataEncoding.Flowdock,
				config,
			);
			expect(extractedMetadata.title).to.equal('"title"');
			expect(extractedMetadata.content).to.equal('"body"');
		});
	});

	describe('FlowdockTranslator.extractSource', () => {
		const messages = [
			'm, blah, test, discourse and thread.[](http://e.com?hidden=whisper&source=m&flow=n&thread=o)',
			'This is mirrored in [bar thread pqr]',
			'This is mirrored in [foo thread stu]',
		];

		it('should just equate to hiddenMD metadata encoding', () => {
			const flowdockObject = FlowdockTranslator.extractSource('m', messages, config, MetadataEncoding.Flowdock);
			const scaffoldObject = TranslatorScaffold.extractSource('m', messages, config, MetadataEncoding.HiddenMD);
			expect(flowdockObject).to.deep.equal(scaffoldObject);
		});
	});

	describe('FlowdockTranslator.makeTagString', () => {
		it('should convert an array of tags into one hashtagged string', () => {
			expect(FlowdockTranslator.makeTagString(['test', 'this'])).to.equal('#test #this');
		});
	});

	describe('FlowdockTranslator.stringifyMetadata', () => {
		const message = {
			details: {
				service: 'a',
				flow: 'j',
				handle: 'b',
				hidden: true,
				tags: [],
				text: 'c',
				time: '2018-04-16T12:45:46+00:00',
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

		it('should just equate to hiddenMD metadata encoding', () => {
			const flowdockString = FlowdockTranslator.stringifyMetadata(message, MetadataEncoding.Flowdock, config);
			const scaffoldString = TranslatorScaffold.stringifyMetadata(message, MetadataEncoding.HiddenMD, config);
			expect(flowdockString).to.equal(scaffoldString);
		});
	});
});
