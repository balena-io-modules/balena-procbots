"use strict";
var _ = require("lodash");
;
;
var Worker = (function () {
    function Worker(repoName, parentList) {
        this.queue = [];
        this.repositoryName = repoName;
        this.parentList = parentList;
        this.parentList.push(this);
    }
    Object.defineProperty(Worker.prototype, "repoName", {
        get: function () {
            return this.repositoryName;
        },
        enumerable: true,
        configurable: true
    });
    Worker.prototype.addEvent = function (event, data, worker) {
        this.queue.push({ event: event, data: data, worker: worker });
        if (this.queue.length === 1) {
            this.runWorker();
        }
    };
    Worker.prototype.runWorker = function () {
        var _this = this;
        var entry = this.queue.shift();
        var self = this;
        entry.worker(entry.event, entry.data)
            .then(function () {
            if (_this.queue.length > 0) {
                process.nextTick(_this.runWorker);
            }
            else {
                self.parentList.splice(_.findIndex(self.parentList, self));
            }
        });
    };
    return Worker;
}());
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
var ProcBot = (function () {
    function ProcBot() {
        this._botname = 'Procbot';
        this._logLevel = process.env.PROCBOT_LOG_LEVEL | LogLevel.WARN;
        this._alertLevel = process.env.PROCBOT_ALERT_LEVEL | AlertLevel.CRITICAL;
        this.workers = [];
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
    Object.defineProperty(ProcBot.prototype, "botname", {
        get: function () {
            return this._botname;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ProcBot.prototype, "logLevel", {
        get: function () {
            return this._logLevel;
        },
        set: function (level) {
            this._logLevel = level;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ProcBot.prototype, "alertLevel", {
        get: function () {
            return this._alertLevel;
        },
        set: function (level) {
            this._alertLevel = level;
        },
        enumerable: true,
        configurable: true
    });
    ProcBot.prototype.output = function (level, classLevel, levelStrings, message) {
        if (level >= classLevel) {
            console.log(levelStrings[level] + " - " + message);
        }
    };
    ProcBot.prototype.log = function (level, message) {
        this.output(level, this._logLevel, this.logLevelStrings, message);
    };
    ProcBot.prototype.alert = function (level, message) {
        this.output(level, this._alertLevel, this.alertLevelStrings, message);
    };
    ProcBot.prototype.queueEvent = function (event) {
        if (!event.workerMethod) {
            console.log("WorkerMethod must be passed into the Githubbot.firedEvent() method");
            return;
        }
        if (!event.repoData) {
            console.log('Could not find a payload or a repository for the event');
            return;
        }
        var entry = _.find(this.workers, function (entry) {
            if (entry.repoName === event.repoData.full_name) {
                return true;
            }
            return false;
        });
        if (!entry) {
            entry = new Worker(event.repoData.full_name, this.workers);
        }
        entry.addEvent(event.event, event.repoData, event.workerMethod);
        return;
    };
    return ProcBot;
}());
exports.ProcBot = ProcBot;

//# sourceMappingURL=procbot.js.map
