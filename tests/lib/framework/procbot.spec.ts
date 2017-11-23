/// <reference types="mocha" />
import { expect } from 'chai';

import { ProcBot } from '../../../lib/framework/procbot';

describe('lib/framework/procbot.ts', () => {

	describe('ProcBot.injectEnvironmentVariables', () => {
		process.env.FOO = 'f';
		process.env.BAR = 'b';

		it('should inject env vars into strings', () => {
			const cookedObject = ProcBot.injectEnvironmentVariables('<<INJECT_FOO>>');
			expect(cookedObject).to.equal('f');
		});

		it('should inject env vars into objects', () => {
			const cookedObject = ProcBot.injectEnvironmentVariables({
				a: '<<INJECT_FOO>>',
			});
			expect(cookedObject).to.deep.equal({
				a: 'f'
			});
		});

		it('should inject env vars into arrays', () => {
			const cookedObject = ProcBot.injectEnvironmentVariables([
				'<<INJECT_FOO>>'
			]);
			expect(cookedObject).to.deep.equal([
				'f',
			]);
		});

		it('should inject env vars into compound strings', () => {
			const cookedObject = ProcBot.injectEnvironmentVariables('/<<INJECT_FOO>>|<<INJECT_BAR>>|<<INJECT_FOO>>\\');
			expect(cookedObject).to.equal('/f|b|f\\');
		});

		it('should inject env vars into nested structures', () => {
			const cookedObject = ProcBot.injectEnvironmentVariables({
				foo: '<<INJECT_FOO>>',
				fooArray: [
					'<<INJECT_FOO>>',
					'<<INJECT_FOO>>',
				],
				fooObject: {
					foo: '<<INJECT_FOO>>',
				}
			});
			expect(cookedObject).to.deep.equal({
				foo: 'f',
				fooArray: [
					'f',
					'f',
				],
				fooObject: {
					foo: 'f',
				}
			});
		});

		it('should leave normal strings alone', () => {
			const cookedObject = ProcBot.injectEnvironmentVariables('baz');
			expect(cookedObject).to.equal('baz');
		});
	});
});
