import { EventsContext, RequestServiceEventsContext } from '../Antlr/RASPParser';
import { BotDetails } from '../parser-types';
import { ExtRASPListener } from '../parser';
export declare class EventRegistrationGenerator {
    static enterRequestServiceEvents(ctx: RequestServiceEventsContext, bot: BotDetails): void;
    static exitRequestServiceEvents(_ctx: RequestServiceEventsContext, bot: BotDetails): void;
    static enterEvents(ctx: EventsContext, bot: BotDetails): void;
}
export declare function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void;
