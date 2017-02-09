import * as Worker from './worker';
export declare enum LogLevel {
    WARN = 0,
    INFO = 1,
    DEBUG = 2,
}
export declare enum AlertLevel {
    CRITICAL = 0,
    ERROR = 1,
}
export declare class ProcBot<T> {
    protected _botname: string;
    protected _logLevel: any;
    protected _alertLevel: any;
    protected workers: Worker.WorkerMap<T>;
    protected getWorker: (event: Worker.WorkerEvent) => Worker.Worker<T>;
    private logLevelStrings;
    private alertLevelStrings;
    constructor(name?: string);
    readonly botName: string;
    protected logLevel: number;
    protected alertLevel: number;
    protected log(level: number, message: string): void;
    protected alert(level: number, message: string): void;
    protected queueEvent(event: Worker.WorkerEvent): void;
    protected removeWorker: (context: T) => void;
    private output(level, classLevel, levelStrings, message);
}
