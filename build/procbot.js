"use strict";
;
;
class Worker {
    constructor(context, parentMap) {
        this.queue = [];
        this._context = context;
        this.parentMap = parentMap;
    }
    get context() {
        return this._context;
    }
    addEvent(event, data, worker) {
        this.queue.push({ event, data, worker });
        if (this.queue.length === 1) {
            this.runWorker();
        }
    }
    runWorker() {
        const entry = this.queue.shift();
        const self = this;
        entry.worker(entry.event, entry.data)
            .then(() => {
            if (this.queue.length > 0) {
                process.nextTick(this.runWorker);
            }
            else {
                self.parentMap.delete(self.context);
            }
        });
    }
}
exports.Worker = Worker;
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
class ProcBot {
    constructor() {
        this._botname = 'Procbot';
        this._logLevel = process.env.PROCBOT_LOG_LEVEL | LogLevel.WARN;
        this._alertLevel = process.env.PROCBOT_ALERT_LEVEL | AlertLevel.CRITICAL;
        this.workers = new Map();
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
    get botname() {
        return this._botname;
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
    output(level, classLevel, levelStrings, message) {
        if (level >= classLevel) {
            console.log(`${levelStrings[level]} - ${message}`);
        }
    }
    log(level, message) {
        this.output(level, this._logLevel, this.logLevelStrings, message);
    }
    alert(level, message) {
        this.output(level, this._alertLevel, this.alertLevelStrings, message);
    }
    queueEvent(event) {
        let entry;
        if (!event.workerMethod) {
            console.log(`WorkerMethod must be passed into the Githubbot.firedEvent() method`);
            return;
        }
        if (!event.data) {
            console.log('Could not find a payload for the event');
            return;
        }
        entry = this.getWorker(event);
        entry.addEvent(event.event, event.data, event.workerMethod);
        return;
    }
}
exports.ProcBot = ProcBot;

//# sourceMappingURL=procbot.js.map
