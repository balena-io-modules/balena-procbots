import { AddListenerContext, ServiceListenerConstructorContext, ServiceNameContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
export declare class ServiceListenerGenerator {
    static enterAddListener(ctx: AddListenerContext, bot: BotDetails): void;
    static exitAddListener(_ctx: AddListenerContext, bot: BotDetails): void;
    static enterServiceName(ctx: ServiceNameContext, bot: BotDetails): void;
    static enterServiceListenerConstructor(ctx: ServiceListenerConstructorContext, bot: BotDetails): void;
    static exitServiceListenerConstructor(ctx: ServiceListenerConstructorContext, bot: BotDetails): void;
}
