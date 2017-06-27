"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ServiceListenerGenerator {
    static enterAddListener(ctx, botStructure) {
        if (botStructure.currentService) {
            throw new Error('There is already a service definition being constructed, error');
        }
        const assignedName = ctx.ALPHA();
        botStructure.currentService = {
            type: 0,
            name: (assignedName) ? assignedName.text : 'defaultServiceListener',
        };
    }
    static exitAddListener(_ctx, botStructure) {
        if (!botStructure.classVariables) {
            botStructure.classVariables = [];
        }
        if (!botStructure.listeners) {
            botStructure.listeners = [];
        }
        if (botStructure.currentService && botStructure.currentService.type === 0) {
            botStructure.classVariables.push({
                name: botStructure.currentService.name,
                type: 0
            });
            botStructure.listeners.push(botStructure.currentService);
        }
    }
    static enterServiceName(ctx, botStructure) {
        const name = ctx.text;
        if (!name) {
            throw new Error('Correct service name was not found');
        }
        if (botStructure.currentService) {
            botStructure.currentService.name = name;
        }
    }
}
exports.ServiceListenerGenerator = ServiceListenerGenerator;

//# sourceMappingURL=service-listener-generator.js.map
