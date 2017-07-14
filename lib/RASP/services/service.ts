import * as _ from 'lodash';
import { AddEmitterContext, AddListenerContext, SetServiceAsContext, ServiceNameContext } from '../Antlr/RASPParser';
import { BotDetails, ClassType, ServiceDefinition, ServiceType } from '../parser-types';
import { DebugExpression } from '../helpers';
import { ExtRASPListener } from '../parser';

export class ServiceGenerator {
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

		// We may well have an object for initialisation. This is the currentExpression.
		if (bot.currentExpression) {
			//DebugExpression(bot.currentExpression);
			bot.currentService.constructDetails = bot.currentExpression;
			bot.currentExpression = undefined;
		}

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
		} else if (bot.currentEventRegistration) {
			bot.currentEventRegistration.serviceName = name;
		}
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['enterAddListener'] = _.partial(ServiceGenerator.enterAddService, _, definition);
	listener['exitAddListener'] = _.partial(ServiceGenerator.exitAddService, _, definition);
	listener['enterAddEmitter'] = _.partial(ServiceGenerator.enterAddService, _, definition);
	listener['exitAddEmitter'] = _.partial(ServiceGenerator.exitAddService, _, definition);
	listener['enterServiceName'] = _.partial(ServiceGenerator.enterServiceName, _, definition);
}
