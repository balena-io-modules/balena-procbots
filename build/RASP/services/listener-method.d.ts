import { ListenerMethodContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class ListenerMethodGenerator {
    static enterListenerMethod(ctx: ListenerMethodContext, bot: BotDetails): void;
    static exitListenerMethod(_ctx: ListenerMethodContext, bot: BotDetails): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
