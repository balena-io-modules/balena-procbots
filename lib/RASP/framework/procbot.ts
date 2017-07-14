import * as _ from 'lodash';
import { BotDefinitionContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class ProcBotGenerator {
	public static exitBotDefinition(ctx: BotDefinitionContext, botStructure: BotDetails): void {
		botStructure.botName = ctx.ID().text;
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['exitBotDefinition'] = _.partial(ProcBotGenerator.exitBotDefinition, _, definition);
}