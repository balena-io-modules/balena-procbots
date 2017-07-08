"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProcBotGenerator {
    static enterBotDefinition(ctx, botStructure) {
    }
    static exitBotDefinition(ctx, botStructure) {
        botStructure.botName = ctx.ID().text;
    }
}
exports.ProcBotGenerator = ProcBotGenerator;

//# sourceMappingURL=procbot.js.map
