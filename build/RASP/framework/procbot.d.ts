import { BotDefinitionContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class ProcBotGenerator {
    static exitBotDefinition(ctx: BotDefinitionContext, botStructure: BotDetails): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
