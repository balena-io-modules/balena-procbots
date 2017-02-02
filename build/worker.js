"use strict";
;
class Worker {
    constructor(context, onDone) {
        this.queue = [];
        this._context = context;
        this.onDone = onDone;
    }
    get context() {
        return this._context;
    }
    addEvent(event) {
        this.queue.push(event);
        if (this.queue.length === 1) {
            this.runWorker();
        }
    }
    runWorker() {
        const entry = this.queue.shift();
        const self = this;
        entry.workerMethod(entry.event, entry.data)
            .then(() => {
            if (this.queue.length > 0) {
                process.nextTick(this.runWorker);
            }
            else {
                self.onDone(self.context);
            }
        });
    }
}
exports.Worker = Worker;

//# sourceMappingURL=worker.js.map
