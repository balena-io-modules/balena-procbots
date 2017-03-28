import { Worker, WorkerEvent, WorkerMap } from './worker';
export declare class WorkerClient<T> {
    protected workers: WorkerMap<T>;
    protected getWorker: (event: WorkerEvent) => Worker<T>;
    protected queueEvent(event: WorkerEvent): void;
    protected removeWorker: (context: T) => void;
}
