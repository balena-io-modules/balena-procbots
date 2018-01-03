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

		it('should leave out-of-scope values alone', () => {
			const cookedObject = ProcBot.injectEnvironmentVariables(false);
			expect(cookedObject).to.equal(false);
		});
	});

	describe('ProcBot.determineInjections', () => {
		process.env.FOO = 'f';
		process.env.BAR = 'b';

		it('should calculate env vars in strings', () => {
			const injections = ProcBot.determineInjections('<<INJECT_FOO>>');
			expect(injections).to.deep.equal({
				FOO: 'f',
			});
		});

		it('should calculate env vars in objects', () => {
			const injections = ProcBot.determineInjections({
				a: '<<INJECT_FOO>>',
			});
			expect(injections).to.deep.equal({
				FOO: 'f',
			});
		});

		it('should calculate env vars in arrays', () => {
			const injections = ProcBot.determineInjections([
				'<<INJECT_FOO>>'
			]);
			expect(injections).to.deep.equal({
				FOO: 'f',
			});
		});

		it('should calculate env vars in compound strings', () => {
			const injections = ProcBot.determineInjections('/<<INJECT_FOO>>|<<INJECT_BAR>>|<<INJECT_FOO>>\\');
			expect(injections).to.deep.equal({
				FOO: 'f',
				BAR: 'b',
			});
		});

		it('should calculate env vars in nested structures', () => {
			const injections = ProcBot.determineInjections({
				foo: '<<INJECT_FOO>>',
				fooArray: [
					'<<INJECT_FOO>>',
					'<<INJECT_FOO>>',
				],
				fooObject: {
					foo: '<<INJECT_FOO>>',
				}
			});
			expect(injections).to.deep.equal({
				FOO: 'f',
			});
		});

		it('should calculate normal strings as no injections', () => {
			const injections = ProcBot.determineInjections('baz');
			expect(injections).to.deep.equal({});
		});

		it('should calculate out-of-scope values as no injections', () => {
			const injections = ProcBot.determineInjections(false);
			expect(injections).to.deep.equal({});
		});
	});
});
