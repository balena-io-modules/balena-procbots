"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const procbot_1 = require("../framework/procbot");
const logger_1 = require("../utils/logger");
class VersionBot extends procbot_1.ProcBot {
    constructor(integration, name, pemString, webhook) {
        super(name);
        this.logger.log(logger_1.LogLevel.INFO, `Ping!`);
    }
}
exports.VersionBot = VersionBot;
function createBot() {
    if (!(process.env.KEYFRAMEBOT_NAME && process.env.KEYFRAMEBOT_INTEGRATION_ID &&
        process.env.KEYFRAMEBOT_PEM && process.env.KEYFRAMEBOT_WEBHOOK_SECRET)) {
        throw new Error(`'KEYFRAMEBOT_NAME', 'KEYFRAMEBOT_INTEGRATION_ID', 'KEYFRAMEBOT_PEM' and ` +
            `'KEYFRAMEBOT_WEBHOOK_SECRET environment variables need setting`);
    }
    return new VersionBot(process.env.KEYFRAMEBOT_INTEGRATION_ID, process.env.KEYFRAMEBOT_NAME, process.env.KEYFRAMEBOT_PEM, process.env.KEYFRAMEBOT_WEBHOOK_SECRET);
}
exports.createBot = createBot;

//# sourceMappingURL=keyframebot.js.map
