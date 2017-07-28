import * as Promise from 'bluebird';
import { ServiceEvent } from '../services/service-types';
export declare type WorkerMethod = (data: ServiceEvent) => Promise<void>;
export declare type WorkerRemove<T> = (context: T) => void;
export interface WorkerEvent {
    data: ServiceEvent;
    workerMethod: WorkerMethod;
}
export declare type WorkerMap<T> = Map<T, Worker<T>>;
export declare class Worker<T> {
    private _context;
    private queue;
    private onDone;
    constructor(context: T, onDone: WorkerRemove<T>);
    readonly context: T;
    addEvent(event: WorkerEvent): void;
    private runWorker();
}
