"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RASPParser_1 = require("../Antlr/RASPParser");
const _ = require("lodash");
class ServiceGenerator {
    static enterAddService(ctx, bot) {
        const type = (ctx instanceof RASPParser_1.AddListenerContext) ? 0 : 1;
        const defaultName = (type === 0) ? 'defaultServiceListener' : 'defaultServiceEmitter';
        if (bot.currentService) {
            throw new Error('There is already a service definition being constructed, error');
        }
        const assignedName = ctx.ALPHA();
        bot.currentService = {
            type,
            name: assignedName ? assignedName.text : defaultName
        };
    }
    static exitAddService(_ctx, bot) {
        if (!bot.currentService) {
            return;
        }
        const type = bot.currentService.type;
        let list;
        if (!bot.classVariables) {
            bot.classVariables = [];
        }
        if (type === 0) {
            if (!bot.listeners) {
                bot.listeners = [];
            }
            list = bot.listeners;
        }
        else if (type === 1) {
            if (!bot.emitters) {
                bot.emitters = [];
            }
            list = bot.emitters;
        }
        if (!list) {
            throw new Error('Incorrect service type!');
        }
        list.push(bot.currentService);
        bot.classVariables.push({
            name: bot.currentService.name,
            type: 0
        });
        bot.currentService = undefined;
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
    static enterServiceConstructor(_ctx, bot) {
        const newConstructor = {};
        if (bot.currentService && !bot.currentService.constructDetails) {
            bot.currentService.constructDetails = newConstructor;
        }
        else {
            ServiceGenerator.currentServiceConstructor[ServiceGenerator.constructorKey] = newConstructor;
        }
        ServiceGenerator.currentServiceConstructor = newConstructor;
    }
    static enterServiceConstructorPair(ctx, bot) {
        const conObj = ServiceGenerator.currentServiceConstructor;
        const text = ctx.text.split(':');
        const key = text[0];
        const value = text[1];
        ServiceGenerator.constructorKey = key;
        if (!_.startsWith(value, '{')) {
            conObj[key] = value;
        }
    }
}
exports.ServiceGenerator = ServiceGenerator;

//# sourceMappingURL=service.js.map
