"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["WARN"] = 0] = "WARN";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 2] = "DEBUG";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
;
var AlertLevel;
(function (AlertLevel) {
    AlertLevel[AlertLevel["CRITICAL"] = 0] = "CRITICAL";
    AlertLevel[AlertLevel["ERROR"] = 1] = "ERROR";
})(AlertLevel = exports.AlertLevel || (exports.AlertLevel = {}));
;
class Logger {
    constructor() {
        this._logLevel = process.env.PROCBOT_LOG_LEVEL || LogLevel.WARN;
        this._alertLevel = process.env.PROCBOT_ALERT_LEVEL || AlertLevel.ERROR;
        this.logLevelStrings = [
            'WARNING',
            'INFO',
            'DEBUG'
        ];
        this.alertLevelStrings = [
            'CRITICAL',
            'ERROR'
        ];
    }
    get logLevel() {
        return this._logLevel;
    }
    set logLevel(level) {
        this._logLevel = level;
    }
    get alertLevel() {
        return this._alertLevel;
    }
    set alertLevel(level) {
        this._alertLevel = level;
    }
    log(level, message) {
        this.output(level, this._logLevel, this.logLevelStrings, message);
    }
    alert(level, message) {
        this.output(level, this._alertLevel, this.alertLevelStrings, message);
    }
    output(level, classLevel, levelStrings, message) {
        if (level >= classLevel) {
            console.log(`${new Date().toISOString()}: ${levelStrings[level]} - ${message}`);
        }
    }
}
exports.Logger = Logger;

//# sourceMappingURL=logger.js.map
