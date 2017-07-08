import * as _ from 'lodash';
import { AddEmitterContext, AddListenerContext, SetServiceAsContext, ServiceNameContext } from '../Antlr/RASPParser';
import { BotDetails, ClassType, ServiceDefinition, ServiceType } from '../parser-types';
import { ExtRASPListener } from '../parser';

export class ServiceGenerator {
    public static currentServiceConstructor: any;
    public static constructorKey: string;

    public static enterAddService(ctx: AddListenerContext | AddEmitterContext, bot: BotDetails): void {
        const type = (ctx instanceof AddListenerContext) ? ServiceType.Listener : ServiceType.Emitter;
        const defaultName = (type === ServiceType.Listener) ? 'defaultServiceListener' : 'defaultServiceEmitter';
        // New ServiceDefinition
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

    public static exitAddService(_ctx: AddListenerContext | AddEmitterContext, bot: BotDetails): void {
        // Verify we have enough information, if required, then push this service listener onto
        // the list of listeners and create a new variable name.
        if (!bot.currentService) {
            return;
        }

        const type = bot.currentService.type;
        let list: ServiceDefinition[] | undefined;
        if (!bot.classVariables) {
            bot.classVariables = [];
        }

        // Add the service to the right list.
        if (type === ServiceType.Listener) {
            if (!bot.listeners) {
                bot.listeners = [];
            }
            list = bot.listeners;
        } else if (type === ServiceType.Emitter) {
            if (!bot.emitters) {
                bot.emitters = [];
            }
            list = bot.emitters;
        }
        if (!list) {
            throw new Error('Incorrect service type!');
        }

        // Push service on.
        list.push(bot.currentService);

        // Ensure we have a new class variable with the right name.
        bot.classVariables.push({
            name: bot.currentService.name,
            type: ClassType.ServiceListener
        });

        // Reset the current service.
        bot.currentService = undefined;
    }

    public static enterServiceName(ctx: ServiceNameContext, bot: BotDetails): void {
        const name = ctx.text;
        if (!name) {
            throw new Error('Correct service name was not found');
        }
        if (bot.currentService) {
            bot.currentService.serviceName = name;
        }
    }

/*
    public static enterServiceConstructor(_ctx: ServiceConstructorContext, bot: BotDetails): void {
        // Create new constructor object.
        const newConstructor = {};

        // If we have no stack (empty array), then we push this on.
        if (bot.currentService && !bot.currentService.constructDetails) {
            bot.currentService.constructDetails = newConstructor;
        } else {
            // Use the previous keyname to create a new nested constructor.
            ServiceGenerator.currentServiceConstructor[ServiceGenerator.constructorKey] = newConstructor;
        }
        ServiceGenerator.currentServiceConstructor = newConstructor;
    }

    // All of the types are unique, so we actually have to ensure that only one per constructor is present
    public static enterServiceConstructorPair(ctx: ServiceConstructorPairContext, bot: BotDetails): void {
        const conObj = ServiceGenerator.currentServiceConstructor;
        const text = ctx.text.split(':');
        const key = text[0];
        const value = text[1];
        ServiceGenerator.constructorKey = key;

        // If this is a nested child, we return here as we'll be caught further down.
        if (!_.startsWith(value, '{')) {
            // Else just assign.
            conObj[key] = value;
        }
    }
*/
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
    listener['enterAddListener'] = _.partial(ServiceGenerator.enterAddService, _, definition);
    listener['exitAddListener'] = _.partial(ServiceGenerator.exitAddService, _, definition);

    listener['enterAddEmitter'] = _.partial(ServiceGenerator.enterAddService, _, definition);
    listener['exitAddEmitter'] = _.partial(ServiceGenerator.exitAddService, _, definition);
    listener['enterServiceName'] = _.partial(ServiceGenerator.enterServiceName, _, definition);    
}
