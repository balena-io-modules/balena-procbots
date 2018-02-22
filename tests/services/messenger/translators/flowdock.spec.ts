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
			expect(FlowdockTranslator.createFormattedText('middle', options)).to.equal(expected);
		});

		it('should inject line prefixes into simple multi-line strings', () => {
			const multiLineString = [
				'first line.',
				'second line.',
				'third line.',
			].join('\n');
			const options = {
				linePrefix: '>'
			};
			const expected = [
				'>first line.',
				'>second line.',
				'>third line.',
			].join('\n');
			expect(FlowdockTranslator.createFormattedText(multiLineString, options)).to.equal(expected);
		});

		it('should inject line prefixes into a compound string', () => {
			const multiLineString = [
				'first line.',
				'second line.',
				'third line.',
			].join('\n');
			const options = {
				linePrefix: '>',
				header: 'top',
				footer: 'bottom',
				metadata: 'stuff',
			};
			const expected = [
				'top',
				'--',
				'>first line.',
				'>second line.',
				'>third line.',
				'bottom',
				'stuff',
			].join('\n');
			expect(FlowdockTranslator.createFormattedText(multiLineString, options)).to.equal(expected);
		});

		it('should format a really long string into one trimmed string', () => {
			const veryLongString = [
				'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut',
				'labore et dolore magna aliqua.',
			].join('\n');
			const lengthLimit = 128;
			const options = {
				lengthLimit,
				linePrefix: '>',
				header: 'De finibus bonorum et malorum',
				footer: '- Cicero',
			};
			const longString = [
				'De finibus bonorum et malorum',
				'--',
				'>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ',
				'`… about 52% shown.`',
				`- Cicero`,
			].join('\n');
			const snippedString = FlowdockTranslator.createFormattedText(veryLongString, options);
			expect(snippedString.length).to.equal(lengthLimit);
			expect(snippedString).to.equal(longString);
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
			const expectedObject = {content: 'h', hidden: true, service: 'g', flow: 'j', thread: 'i', hmac};
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
				'>h',
				'> i',
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
