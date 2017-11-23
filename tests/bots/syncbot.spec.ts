/// <reference types="mocha" />
import { expect } from 'chai';

import { SyncBot } from '../../lib/bots/syncbot';

describe('lib/bots/syncbot.ts', () => {

	describe('SyncBot.getErrorSolution', () => {
		it('should find the correct fixes for a given error message', () => {
			const solutionSuggestion = SyncBot.getErrorSolution(
				'foo',
				'bah',
				{
					foo: {
						'^ba': {
							description: 'baz',
							fixes: [
								'do something',
							],
						},
					},
				},
			);
			expect(solutionSuggestion).to.deep.equal({
				description: 'baz',
				fixes: [
					'do something',
				],
			});
		});
	});
});
