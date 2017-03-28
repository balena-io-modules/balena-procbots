"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class WorkerClient {
    constructor() {
        this.workers = new Map();
        this.removeWorker = (context) => {
            this.workers.delete(context);
        };
    }
    queueEvent(event) {
        let entry;
        if (!event.workerMethod) {
            return;
        }
        if (!event.data) {
            return;
        }
        entry = this.getWorker(event);
        entry.addEvent(event);
    }
}
exports.WorkerClient = WorkerClient;

//# sourceMappingURL=worker-client.js.map
