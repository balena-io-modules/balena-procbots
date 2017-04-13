"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
        const entry = this.queue[0];
        entry.workerMethod(entry.data)
            .then(() => {
            this.queue.shift();
            if (this.queue.length > 0) {
                this.runWorker();
            }
            else {
                this.onDone(this.context);
            }
        });
    }
}
exports.Worker = Worker;

//# sourceMappingURL=worker.js.map
