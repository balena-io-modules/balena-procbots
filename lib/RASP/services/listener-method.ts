import * as _ from 'lodash';
import { ListenerMethodContext } from '../Antlr/RASPParser';
import { BotDetails, ListenerMethod } from '../parser-types';
import { DebugExpression } from '../helpers';
import { ExtRASPListener } from '../parser';

export class ListenerMethodGenerator {
    public static enterListenerMethod(ctx: ListenerMethodContext, bot: BotDetails): void {
        // New ListenerMethod
        if (bot.currentListenerMethod) {
            throw new Error('There is already a event registration being constructed, error');
        }
        bot.currentListenerMethod = {
            name: ctx.ID().text
        };
    }

    public static exitListenerMethod(_ctx: ListenerMethodContext, bot: BotDetails): void {
        // Push this into the events registrations.
        if (bot.currentListenerMethod) {
            if (!bot.listenerMethods) {
                bot.listenerMethods = [];
            }
            // Push onto the bot.
            bot.listenerMethods.push(bot.currentListenerMethod);
        }
        bot.currentListenerMethod = undefined;
    }
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
    listener['enterListenerMethod'] = _.partial(ListenerMethodGenerator.enterListenerMethod, _, definition);
    listener['exitListenerMethod'] = _.partial(ListenerMethodGenerator.exitListenerMethod, _, definition);
}