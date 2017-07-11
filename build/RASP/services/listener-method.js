"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class ListenerMethodGenerator {
    static enterListenerMethod(ctx, bot) {
        if (bot.currentListenerMethod) {
            throw new Error('There is already a event registration being constructed, error');
        }
        bot.currentListenerMethod = {
            name: ctx.ID().text
        };
    }
    static exitListenerMethod(_ctx, bot) {
        if (bot.currentListenerMethod) {
            if (!bot.listenerMethods) {
                bot.listenerMethods = [];
            }
            bot.listenerMethods.push(bot.currentListenerMethod);
        }
        bot.currentListenerMethod = undefined;
    }
}
exports.ListenerMethodGenerator = ListenerMethodGenerator;
function addListenerMethods(listener, definition) {
    listener['enterListenerMethod'] = _.partial(ListenerMethodGenerator.enterListenerMethod, _, definition);
    listener['exitListenerMethod'] = _.partial(ListenerMethodGenerator.exitListenerMethod, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=listener-method.js.map
