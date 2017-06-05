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
import * as _ from 'lodash';

// This is class and not a module as it allows different clients to change their
// log level without affecting the rest of the system.

import * as _ from 'lodash';

/**
 * Logging levels are stacked, with a chosen logging level also triggering all
 * levels below it; choosing a logging level of DEBUG will cause all DEBUG,
 * INFO & WARN levels to be output, choosing a logging level of WARN will only cause
 * WARN levels to be output.
 * They are arranged this way to allow additional items to be added if required.
 */
export enum LogLevel {
    /** Warning level. */
    WARN = 0,
    /** Information level. Includes WARN level. */
    INFO,
    /** Debug level. Includes INFO and WARN level. */
    DEBUG
};

/**
 * Alerting levels are stacked, with a chosen alerting level also triggering all
 * levels below it; choosing an alerting level of ERROR will cause both
 * ERROR & CRITICAL output to be sent to the alert system; choosing CRITICAL will only
 * output CRITICAL errors to the alert system.
 * They are arranged this way to allow additional items to be added if required.
 */
export enum AlertLevel {
    /** Critical alert level. */
    CRITICAL = 0,
    /** Error level. Includes CRITICAL level. */
    ERROR
};

/**
 * The Logger class allows output from the bots and services to any useful medium.
 * Currently the only output is of that to the console.
 */
export class Logger {
    // Log and Alert levels are taken from an envvar or set to the minimum.
    // These can be overriden by specific methods.
    private _logLevel = _.parseInt(process.env.PROCBOT_LOG_LEVEL) || LogLevel.INFO;
    private _alertLevel = _.parseInt(process.env.PROCBOT_ALERT_LEVEL) || AlertLevel.ERROR;

    /** Strings prepended to logging output. */
    private logLevelStrings = [
        'WARNING',
        'INFO',
        'DEBUG'
    ];

    /** Strings prepended to alerting output. */
    private alertLevelStrings = [
        'CRITICAL',
        'ERROR'
    ];

    /**
     * Get the logging level.
     * @return  Current logging level.
     */
    public get logLevel(): LogLevel {
        return this._logLevel;
    }

    /**
     * Set logging evel.
     * @param level Logging level to use.
     */
    public set logLevel(level: LogLevel) {
        this._logLevel = level;
    }

    /**
     * Get the alert level.
     * @return  Current alerting level.
     */
    public get alertLevel(): AlertLevel {
        return this._alertLevel;
    }

    /**
     * Set alert level.
     * @param level Alerting level to use.
     */
    public set alertLevel(level: AlertLevel) {
        this._alertLevel = level;
    }

    /**
     * Log output.
     * @param level     The level that this message is of (INFO, etc.).
     * @param message   The actual log message.
     * @param secrets   An optional array of strings to redact
     */
    public log(level: number, message: string, secrets?: string[]): void {
        if (secrets) {
            const redactFilter = secrets.map((secret) => {
                return _.escapeRegExp(secret);
            }).join('|');
            message = message.replace(new RegExp(redactFilter, 'g'), 'redacted');
        }
        this.output(level, this._logLevel, this.logLevelStrings, message);
    }

    /**
     * Alert output.
     * @param level     The level that this message is of (ERROR, etc.).
     * @param message   The actual alert message.
     */
    public alert(level: number, message: string): void {
        this.output(level, this._alertLevel, this.alertLevelStrings, message);
    }

    // Generic output method for either type.
    private output(level: number, classLevel: number, levelStrings: string[], message: string): void {
        if (level <= classLevel) {
            console.log(`${new Date().toISOString()}: ${levelStrings[level]} - ${message}`);
        }
    }
}
