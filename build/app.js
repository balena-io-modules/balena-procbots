"use strict";
var Opts = require("node-getopt");
var express = require("express");
var bodyParser = require("body-parser");
var _ = require("lodash");
var hmac = require('crypto');
var getopt = new Opts([
    ['b', 'bot-names=ARG+', 'Determines which bots will run'],
    ['h', 'help', 'This help message']
]);
getopt.setHelp("\nUsage: " + process.argv[1].split('/').slice(-1) + " [OPTION]\n[[OPTIONS]]\n");
var opt = getopt.parse(process.argv.slice(2));
if (opt.options['help'] || Object.keys(opt.options).length === 0) {
    console.log(getopt.getHelp());
    process.exit(0);
}
function verifyWebhookToken(payload, hubSignature) {
    var newHmac = hmac.createHmac('sha1', process.env.WEBHOOK_SECRET);
    newHmac.update(payload);
    if (('sha1=' + newHmac.digest('hex')) === hubSignature) {
        return true;
    }
    return false;
}
var app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var botRegistry = [];
for (var _i = 0, _a = opt.options['bot-names']; _i < _a.length; _i++) {
    var bot = _a[_i];
    try {
        var importedBot = require("./" + bot);
        botRegistry.push(importedBot.createBot());
        console.log("Imported " + bot + "...");
    }
    catch (err) {
        console.log("Could not import bot type " + bot);
        console.log(err);
        throw err;
    }
}
app.post('/webhooks', function (req, res) {
    var eventType = req.get('x-github-event');
    var payload = req.body;
    if (req.get('x-hub-signature'))
        if (!verifyWebhookToken(JSON.stringify(payload), req.get('x-hub-signature'))) {
            res.sendStatus(401);
            return;
        }
    res.sendStatus(200);
    console.log(eventType);
    _.forEach(botRegistry, function (bot) {
        if (_.includes(bot.webhooks, eventType) === true) {
            bot.firedEvent(eventType, payload);
        }
    });
});
app.listen(4567, function () {
    console.log('Listening for github hooks on port 4567.');
});

//# sourceMappingURL=app.js.map
