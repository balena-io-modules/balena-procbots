"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const Opts = require("node-getopt");
const logger_1 = require("./utils/logger");
const getopt = new Opts([
    ['b', 'bot-names=ARG+', 'Determines which bots will run'],
    ['h', 'help', 'This help message'],
]);
const logger = new logger_1.Logger();
getopt.setHelp(`
Usage: ${process.argv[1].split('/').slice(-1)} [OPTION]
[[OPTIONS]]
`);
const opt = getopt.parse(process.argv.slice(2));
if (opt.options['help'] || Object.keys(opt.options).length === 0) {
    logger.log(logger_1.LogLevel.WARN, getopt.getHelp());
    process.exit(0);
}
logger.log(logger_1.LogLevel.INFO, `---> ${process.env.npm_package_name}, Version ${process.env.npm_package_version} <---`);
const app = express();
app.get('/ping', (_req, res) => {
    res.send('OK');
});
app.listen(8080, () => {
    logger.log(logger_1.LogLevel.INFO, `---> Started 'ping' service on port 8080`);
});
let botRegistry = [];
for (let bot of opt.options['bot-names']) {
    try {
        let importedBot = require(`./bots/${bot}`);
        botRegistry.push(importedBot.createBot());
        logger.log(logger_1.LogLevel.INFO, `---> Imported ${bot}...`);
    }
    catch (err) {
        logger.log(logger_1.LogLevel.WARN, `---> Could not import bot type ${bot}`);
        logger.log(logger_1.LogLevel.WARN, err);
        throw err;
    }
}

//# sourceMappingURL=app.js.map
