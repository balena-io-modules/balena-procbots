import * as _ from 'lodash';
import { EventsContext, RequestServiceEventsContext } from '../Antlr/RASPParser';
import { BotDetails, ClassType, ServiceDefinition, ServiceType } from '../parser-types';
import { DebugExpression } from '../helpers';
import { ExtRASPListener } from '../parser';

export class EventRegistrationGenerator {
	public static enterRequestServiceEvents(ctx: RequestServiceEventsContext, bot: BotDetails): void {
		// New EventRegistration
		if (bot.currentEventRegistration) {
			throw new Error('There is already a event registration being constructed, error');
		}
		bot.currentEventRegistration = {
			methodName: ctx.ID().text
		};
	}

	public static exitRequestServiceEvents(_ctx: RequestServiceEventsContext, bot: BotDetails): void {
		// Push this into the events registrations.
		if (!bot.registrations) {
			bot.registrations = [];
		}
		if (bot.currentEventRegistration) {
			bot.registrations.push(bot.currentEventRegistration);
		}
		bot.currentEventRegistration = undefined;
	}

	public static enterEvents(ctx: EventsContext, bot: BotDetails): void {
		if (bot.currentEventRegistration) {
			bot.currentEventRegistration.events = [];
			for (let event of ctx.ID()) {
				bot.currentEventRegistration.events.push(event.text);
			}
		}
	}
}

export function addListenerMethods(listener: ExtRASPListener, definition: BotDetails): void {
	listener['enterRequestServiceEvents'] = _.partial(EventRegistrationGenerator.enterRequestServiceEvents, _, definition);
	listener['exitRequestServiceEvents'] = _.partial(EventRegistrationGenerator.exitRequestServiceEvents, _, definition);
	listener['enterEvents'] = _.partial(EventRegistrationGenerator.enterEvents, _, definition);
}