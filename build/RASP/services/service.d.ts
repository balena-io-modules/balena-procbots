import { AddEmitterContext, AddListenerContext, ServiceConstructorContext, ServiceConstructorPairContext, ServiceNameContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
export declare class ServiceGenerator {
    static currentServiceConstructor: any;
    static constructorKey: string;
    static enterAddService(ctx: AddListenerContext | AddEmitterContext, bot: BotDetails): void;
    static exitAddService(_ctx: AddListenerContext | AddEmitterContext, bot: BotDetails): void;
    static enterServiceName(ctx: ServiceNameContext, bot: BotDetails): void;
    static enterServiceConstructor(_ctx: ServiceConstructorContext, bot: BotDetails): void;
    static enterServiceConstructorPair(ctx: ServiceConstructorPairContext, bot: BotDetails): void;
}
