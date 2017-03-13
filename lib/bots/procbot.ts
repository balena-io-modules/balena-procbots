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
import * as Promise from 'bluebird';
import * as FS from 'fs';
import * as yaml from 'js-yaml';
import { ProcBotConfiguration } from './procbot-types';
import * as Worker from './worker';

const fsReadFile = Promise.promisify(FS.readFile);

// A note on coding style here.
// Exported enums and types are considered as a similar pattern to static types in
// C++. That is, we can import a module using `import * as ProcBot from `./procbot'` and
// then reference the enums/types as if these were static, eg. `thing = ProcBot.LogLevel.WARN`
// The advantage with this is it's obvious where it comes from.
// Ideally, we'd have enums protected in the class, but we don't appear to be able to do that
// in TS.

/////////

// Logging levels are stacked, with a chosen logging level also triggering all
// levels below it; choosing a logging level of DEBUG will cause all DEBUG,
// INFO & WARN levels to be output, choosing a logging level of WARN will only cause
// WARN levels to be output.
// They are arranged this way to allow additional items to be added if required.
export enum LogLevel {
    WARN = 0,
    INFO,
    DEBUG
};

// Alerting levels are stacked, with a chosen alerting level also triggering all
// levels below it; choosing an alerting level of ERROR will cause both
// ERROR & CRITICAL output to be sent to the alert system; choosing CRITICAL will only
// output CRITICAL errors to the alert system.
// They are arranged this way to allow additional items to be added if required.
export enum AlertLevel {
    CRITICAL = 0,
    ERROR
};

// The ProcBot class is a parent class that can be used for some top-level tasks:
//  * Schedule the processing of events clustered by a given context
//  * Perform logging duties
//  * Perform alerting duties
export class ProcBot<T> {
    // Log and Alert levels are taken from an envvar or set to the minimum.
    // These can be overriden by specific methods.
    protected _botname = 'Procbot';
    protected _logLevel = process.env.PROCBOT_LOG_LEVEL || LogLevel.WARN;
    protected _alertLevel = process.env.PROCBOT_ALERT_LEVEL || AlertLevel.ERROR;
    protected workers: Worker.WorkerMap<T> = new Map<T, Worker.Worker<T>>();

    // This generic method must be implemented in children extended from a ProcBot.
    // It defines the context type used for Workers.
    protected getWorker: (event: Worker.WorkerEvent) => Worker.Worker<T>;

    // Strings prepended to logging output.
    private logLevelStrings = [
        'WARNING',
        'INFO',
        'DEBUG'
    ];
    // Strings prepended to alerting output.
    private alertLevelStrings = [
        'CRITICAL',
        'ERROR'
    ];

    constructor(name = 'ProcBot') {
        this._botname = name;
    }

    // Get the name of the bot.
    public get botName(): string {
        return this._botname;
    }

    // Get the log level.
    protected get logLevel(): LogLevel {
        return this._logLevel;
    }

    // Set logLevel
    protected set logLevel(level: LogLevel) {
        this._logLevel = level;
    }

    // Get alert level.
    protected get alertLevel(): AlertLevel {
        return this._alertLevel;
    }

    // Set logLevel
    protected set alertLevel(level: AlertLevel) {
        this._alertLevel = level;
    }

    // Log output.
    protected log(level: number, message: string): void {
        this.output(level, this._logLevel, this.logLevelStrings, message);
    }

    // Alert output.
    protected alert(level: number, message: string): void {
        this.output(level, this._alertLevel, this.alertLevelStrings, message);
    }

    // Process a configuration file from YAML into a nested object.
    protected processConfiguration(configFile: string): ProcBotConfiguration | void {
        const config: ProcBotConfiguration = yaml.safeLoad(configFile);

        if (!config) {
            return;
        }

        // Swap out known tags that become booleans.
        const minimumVersion = ((config || {}).procbot || {}).minimum_version;
        if (minimumVersion && process.env.npm_package_version) {
            if (process.env.npm_package_version < minimumVersion) {
                throw new Error('Current ProcBot implementation does not meet minimum required version to run');
            }
        }

        return config;
    }

    // Retrieve a configuration file.
    // This default implementation assumes a pathname.
    protected retrieveConfiguration(path: string): Promise<ProcBotConfiguration> | Promise<void> {
        return fsReadFile(path).call('toString').then((contents) => {
            return this.processConfiguration(contents);
        }).catch(() => {
            this.log(this._logLevel.INFO, 'No config file was found');
        });
    }

    // Queue an event ready for running in a child.
    protected queueEvent(event: Worker.WorkerEvent): void {
        let entry: Worker.Worker<T> | undefined;

        if (!event.workerMethod) {
            this.log(LogLevel.WARN, `WorkerMethod must be passed into the Githubbot.firedEvent() method`);
            return;
        }

        // Look at the repo. If there's no repo, we can't actually do anything with this.
        if (!event.data) {
            this.log(LogLevel.WARN, 'Could not find a payload for the event');
            return;
        }

        // Retrieve any worker with a matching context, or create a new one.
        // Bot implementation specific.
        entry = this.getWorker(event);

        // Now add the event to the found/created repo worker.
        entry.addEvent(event);
    }

    // Remove a worker from a context post-action.
    protected removeWorker = (context: T): void => {
        this.workers.delete(context);
    }

    // Generic output method for either type.
    // FIXME: Alter this to output to the appropriate external service.
    private output(level: number, classLevel: number, levelStrings: string[], message: string): void {
        if (level >= classLevel) {
            console.log(`${new Date().toISOString()}: ${levelStrings[level]} - ${message}`);
        }
    }
}
