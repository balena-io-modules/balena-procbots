import { BotDefinitionContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';

export class ProcBotGenerator {
    // RASP listener methods.
    // The idea here is to generate required TS code on the fly for RASP definitions.
    // It looks at the contexts and then fills in all required data as it goes. To achieve this,
    // it fills in the ongoing bot interface so that other listeners can get a full picture of
    // the structure of the bot.
    public static enterBotDefinition(ctx: BotDefinitionContext, botStructure: BotDetails): void {
    }

    public static exitBotDefinition(ctx: BotDefinitionContext, botStructure: BotDetails): void {
        botStructure.botName = ctx.ID().text;
    }
}
