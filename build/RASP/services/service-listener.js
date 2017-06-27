"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServiceListenerGenerator {
    static enterAddListener(ctx, bot) {
        if (bot.currentService) {
            throw new Error('There is already a service definition being constructed, error');
        }
        const assignedName = ctx.ALPHA();
        bot.currentService = {
            type: 0,
            name: (assignedName) ? assignedName.text : 'defaultServiceListener',
        };
    }
    static exitAddListener(_ctx, bot) {
        if (!bot.classVariables) {
            bot.classVariables = [];
        }
        if (!bot.listeners) {
            bot.listeners = [];
        }
        if (bot.currentService && bot.currentService.type === 0) {
            bot.classVariables.push({
                name: bot.currentService.name,
                type: 0
            });
            bot.listeners.push(bot.currentService);
            bot.currentService = undefined;
        }
    }
    static enterServiceName(ctx, bot) {
        const name = ctx.text;
        if (!name) {
            throw new Error('Correct service name was not found');
        }
        if (bot.currentService) {
            bot.currentService.serviceName = name;
        }
    }
    static enterServiceListenerConstructor(ctx, bot) {
        if (!bot.currentService || !(bot.currentRegistration.type === 0)) {
            throw new Error('Service should be Listener but is not');
        }
    }
    static exitServiceListenerConstructor(ctx, bot) {
    }
}
exports.ServiceListenerGenerator = ServiceListenerGenerator;

//# sourceMappingURL=service-listener.js.map
