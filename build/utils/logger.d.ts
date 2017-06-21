export declare enum LogLevel {
    WARN = 0,
    INFO = 1,
    DEBUG = 2,
}
export declare enum AlertLevel {
    CRITICAL = 0,
    ERROR = 1,
}
export declare class Logger {
    private _logLevel;
    private _alertLevel;
    private logLevelStrings;
    private alertLevelStrings;
    logLevel: LogLevel;
    alertLevel: AlertLevel;
    log(level: number, message: string, secrets?: string[]): void;
    alert(level: number, message: string): void;
    private output(level, classLevel, levelStrings, message);
}
