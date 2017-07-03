/*
Copyright 2016-2017 Resin.io

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
import * as express from 'express';
import Opts = require('node-getopt');
import { ProcBot } from './framework/procbot';
import { Logger, LogLevel } from './utils/logger';

// Arguments determine which bot type we want to use.
const getopt = new Opts([
	[ 'b',	'bot-names=ARG+',   'Determines which bots will run'],
	[ 'h',	'help',			 'This help message'],
]);

// Create a new Logger.
const logger = new Logger();

// Set options help.
getopt.setHelp(`
Usage: ${process.argv[1].split('/').slice(-1)} [OPTION]
[[OPTIONS]]
`);

// No options, no run.
const opt = getopt.parse(process.argv.slice(2));
if (opt.options['help'] || Object.keys(opt.options).length === 0) {
	logger.log(LogLevel.WARN, getopt.getHelp());
	process.exit(0);
}

// Startup text.
logger.log(LogLevel.INFO, `---> ${process.env.npm_package_name}, Version ${process.env.npm_package_version} <---`);

// Create Ping server.
const app = express();
app.get('/ping', (_req: any, res: any) => {
	res.send('OK');
});

app.listen(8080, () => {
	logger.log(LogLevel.INFO, `---> Started 'ping' service on port 8080`);
});

// Import any specified bots. These will all listen for webhooks.
let botRegistry: ProcBot[] = [];
for (let bot of <string[]>opt.options['bot-names']) {
	// Dynamically require the bots.
	try {
		let importedBot = require(`./bots/${bot}`);
		botRegistry.push(importedBot.createBot());
		logger.log(LogLevel.INFO, `---> Imported ${bot}...`);
	} catch (err) {
		logger.log(LogLevel.WARN, `---> Could not import bot type ${bot}`);
		logger.log(LogLevel.WARN, err);
		throw err;
	}
}
