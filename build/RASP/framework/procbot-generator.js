"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProcBotGenerator {
    static enterBotDefinition(ctx, botStructure) {
    }
    static exitBotDefinition(ctx, botStructure) {
        botStructure.botName = ctx.ALPHA().text;
    }
}
exports.ProcBotGenerator = ProcBotGenerator;

//# sourceMappingURL=procbot-generator.js.map
