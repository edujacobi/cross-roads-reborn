export declare const logger: import("pino").Logger<never>;
export declare enum LogType {
    Info = 0,
    Warning = 1,
    Error = 2,
    Success = 3
}
export declare class LogManager {
    private static Queue;
    private static Interval;
    static Initialize(): void;
    static Push(log: Log): void;
    private static Flush;
}
export declare class Log {
    Message: string;
    Type: LogType;
    Title: string;
    constructor(type: LogType, message: string);
    static Info(message: string): Log;
    static Warning(message: string): Log;
    static Error(message: string): Log;
    static Success(message: string): Log;
}
