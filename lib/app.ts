/*
Copyright 2016 Resin.io

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Import most things with types if possible.
import Opts = require('node-getopt');
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as _ from 'lodash';
import * as Promise from 'bluebird';
import { GithubBot } from './githubbot';

const hmac = require('crypto');

// Arguments determine which bot type we want to use.
const getopt = new Opts([
	[ 'b',	'bot-names=ARG+',	'Determines which bots will run'],
	[ 'h',	'help',				'This help message']
]);

getopt.setHelp(`
	Usage: ${process.argv[1].split('/').slice(-1)} [OPTION]
`);

// No options, no run.
const opt = getopt.parse(process.argv.slice(2))
if (opt.options['help'] || Object.keys(opt.options).length === 0) {
	console.log(getopt.getHelp());
	process.exit(0)
}

// Verify the sender of data is allowed to.
function verifyWebhookToken(payload: string, hubSignature: string) {
	const newHmac: any = hmac.createHmac('sha1', process.env.WEBHOOK_SECRET);
	newHmac.update(payload);
	if (('sha1=' + newHmac.digest('hex')) === hubSignature) {
		return true;
	}

	return false;
}

// Standard Express gubbins.
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

	// Import any specified bots. These will all listen for webhooks.
let botRegistry: GithubBot[] = [];
for (let bot of opt.options['bot-names']) {
	// Dynamically require the bots.
	try {
		let importedBot = require(`./${bot}`);
		botRegistry.push(importedBot.createBot());
		console.log(`Imported ${bot}...`)
	} catch (err) {
		console.log(`Could not import bot type ${bot}`);
		throw err;
	}
}

// Run the hook listener now, and for each bot we've been asked to listen
// to, wait for events. When we get an event, check against those bots
// registered, and send filtered messages on to them for action.
app.post('/webhooks', (req: any, res: any) => {
	const eventType: string = req.get('x-github-event');
	const payload = req.body;

	if (req.get('x-hub-signature'))

	// Ensure that the sender is authorised and uses our secret.
	if (!verifyWebhookToken(JSON.stringify(payload), req.get('x-hub-signature'))) {
		res.sendStatus(401);
		return;
	}

	// Let the hook get on with it.
	res.sendStatus(200);

	console.log(eventType);

	// Go through all registered bots, and send them any appropriate hook.
	_.forEach(botRegistry, (bot: GithubBot) => {
		if (_.includes(bot.webhooks, eventType) === true) {
			bot.firedEvent(eventType, payload);
		}
	});
});

// Listen on 4567 for the moment.
app.listen(4567, () => {
	console.log('Listening for github hooks on port 4567.');
});




