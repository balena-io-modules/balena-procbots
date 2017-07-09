"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const RASPParser_1 = require("../Antlr/RASPParser");
class ServiceGenerator {
    static enterAddService(ctx, bot) {
        const type = (ctx instanceof RASPParser_1.AddListenerContext) ? 0 : 1;
        const defaultName = (type === 0) ? 'defaultServiceListener' : 'defaultServiceEmitter';
        if (bot.currentService) {
            throw new Error('There is already a service definition being constructed, error');
        }
        let assignedName = '';
        const serviceAsContext = ctx.setServiceAs();
        if (serviceAsContext) {
            assignedName = serviceAsContext.ID().text;
        }
        bot.currentService = {
            type,
            name: assignedName ? assignedName : defaultName
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
        if (bot.currentExpression) {
            bot.currentService.constructDetails = bot.currentExpression;
            bot.currentExpression = undefined;
        }
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
        else if (bot.currentEventRegistration) {
            bot.currentEventRegistration.serviceName = name;
        }
    }
}
exports.ServiceGenerator = ServiceGenerator;
function addListenerMethods(listener, definition) {
    listener['enterAddListener'] = _.partial(ServiceGenerator.enterAddService, _, definition);
    listener['exitAddListener'] = _.partial(ServiceGenerator.exitAddService, _, definition);
    listener['enterAddEmitter'] = _.partial(ServiceGenerator.enterAddService, _, definition);
    listener['exitAddEmitter'] = _.partial(ServiceGenerator.exitAddService, _, definition);
    listener['enterServiceName'] = _.partial(ServiceGenerator.enterServiceName, _, definition);
}
exports.addListenerMethods = addListenerMethods;

//# sourceMappingURL=service.js.map
