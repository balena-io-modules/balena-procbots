import { AddEmitterContext, AddListenerContext, ServiceNameContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class ServiceGenerator {
    static enterAddService(ctx: AddListenerContext | AddEmitterContext, bot: BotDetails): void;
    static exitAddService(_ctx: AddListenerContext | AddEmitterContext, bot: BotDetails): void;
    static enterServiceName(ctx: ServiceNameContext, bot: BotDetails): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
