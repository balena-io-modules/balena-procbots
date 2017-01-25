"use strict";
const Opts = require("node-getopt");
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const hmac = require('crypto');
const getopt = new Opts([
    ['b', 'bot-names=ARG+', 'Determines which bots will run'],
    ['h', 'help', 'This help message']
]);
getopt.setHelp(`
Usage: ${process.argv[1].split('/').slice(-1)} [OPTION]
[[OPTIONS]]
`);
const opt = getopt.parse(process.argv.slice(2));
if (opt.options['help'] || Object.keys(opt.options).length === 0) {
    console.log(getopt.getHelp());
    process.exit(0);
}
function verifyWebhookToken(payload, hubSignature) {
    const newHmac = hmac.createHmac('sha1', process.env.WEBHOOK_SECRET);
    newHmac.update(payload);
    if (('sha1=' + newHmac.digest('hex')) === hubSignature) {
        return true;
    }
    return false;
}
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
let botRegistry = [];
for (let bot of opt.options['bot-names']) {
    try {
        let importedBot = require(`./${bot}`);
        botRegistry.push(importedBot.createBot());
        console.log(`Imported ${bot}...`);
    }
    catch (err) {
        console.log(`Could not import bot type ${bot}`);
        console.log(err);
        throw err;
    }
}
app.post('/webhooks', (req, res) => {
    const eventType = req.get('x-github-event');
    const payload = req.body;
    if (req.get('x-hub-signature'))
        if (!verifyWebhookToken(JSON.stringify(payload), req.get('x-hub-signature'))) {
            res.sendStatus(401);
            return;
        }
    res.sendStatus(200);
    console.log(eventType);
    _.forEach(botRegistry, (bot) => {
        bot.firedEvent(eventType, payload);
    });
});
app.listen(4567, () => {
    console.log('Listening for github hooks on port 4567.');
});

//# sourceMappingURL=app.js.map
