import { LogTransport, LogTransportOptions } from './log-transport';
import { LogEntry } from '../log-entry';
import { LoggerJsonSerialiser } from '../utilities';
import { LogLevel } from '../log-level';

export const defaultConsoleFormat = (entry: LogEntry, buffer?: string[]) => {
    const args: string[] = [entry.message];

    if (entry.error) {
        args.push(`\r${entry.error.stack}`);
        args.push('\r');
        args.push('\rContext:', LoggerJsonSerialiser.serialise(entry.context));
    }

    if (entry.data)
        args.push('\rData:', LoggerJsonSerialiser.serialise(entry.data));

    if (buffer && buffer.length > 0)
        args.push(`\r\rLog Buffer:\r${buffer.join('\r')}`);

    return args;
};

export interface ConsoleTransportOptions extends LogTransportOptions {
    format?: (entry: LogEntry, buffer?: string[]) => string[];
}

export class ConsoleTransport extends LogTransport<ConsoleTransportOptions> {
    constructor(options?: ConsoleTransportOptions) {
        super(options);
    }

    public log(entry: LogEntry, buffer?: string[]): void {
        let level = entry.level;
        if (level === LogLevel.Critical)
            level = LogLevel.Error;
        const logMethod = (console as any)[level in console ? level : 'log'];
        logMethod.apply(console, this.format(entry, buffer));
    }

    public async wait(): Promise<void> {
    }

    private format(entry: LogEntry, buffer?: string[]): string[] {
        if (!this.options || !this.options.format)
            return defaultConsoleFormat(entry, buffer);

        return this.options.format(entry, buffer);
    }
}