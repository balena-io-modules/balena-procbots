import { BotDefinitionContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
export declare class ProcBotGenerator {
    static enterBotDefinition(ctx: BotDefinitionContext, botStructure: BotDetails): void;
    static exitBotDefinition(ctx: BotDefinitionContext, botStructure: BotDetails): void;
}
