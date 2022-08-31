import { LogLevel } from '../log-level';
import { LogEntry } from '../log-entry';

export interface LogTransportOptions {
    level?: LogLevel;
}

export abstract class LogTransport<TOptions extends LogTransportOptions = LogTransportOptions> {
    public get level(): LogLevel {
        if (!this.options || !this.options.level)
            return LogLevel.Debug;

        return this.options.level;
    }

    constructor(protected readonly options?: TOptions) {
    }

    public abstract log(entry: LogEntry, buffer?: string[]): void;

    public abstract async wait(): Promise<void>;
}
