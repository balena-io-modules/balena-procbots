"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
class EventRegistrationGenerator {
    static enterRequestServiceEvents(ctx, bot) {
        if (bot.currentEventRegistration) {
            throw new Error('There is already a event registration being constructed, error');
        }
        bot.currentEventRegistration = {
            methodName: ctx.ID().text
        };
    }
    static exitRequestServiceEvents(_ctx, bot) {
        if (!bot.registrations) {
            bot.registrations = [];
        }
        if (bot.currentEventRegistration) {
            bot.registrations.push(bot.currentEventRegistration);
        }
        bot.currentEventRegistration = undefined;
    }
    static enterEvents(ctx, bot) {
        if (bot.currentEventRegistration) {
            bot.currentEventRegistration.events = [];
            for (let event of ctx.ID()) {
                bot.currentEventRegistration.events.push(event.text);
            }
        }
    }
}
exports.EventRegistrationGenerator = EventRegistrationGenerator;
function addListenerMethods(listener, definition) {
    listener['enterRequestServiceEvents'] = _.partial(EventRegistrationGenerator.enterRequestServiceEvents, _, definition);
    listener['exitRequestServiceEvents'] = _.partial(EventRegistrationGenerator.exitRequestServiceEvents, _, definition);
    listener['enterEvents'] = _.partial(EventRegistrationGenerator.enterEvents, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=events.js.map
