import { LogContextResolver } from './log-context-resolver';
import { LogTransport, ConsoleTransport } from './transports';
import { LogLevel } from './log-level';
import { LogEntry } from './log-entry';
import { LogEntryBuffer } from './log-entry-buffer';
import { Connection } from 'typeorm';
import { ensureProperties } from '../utilities';
import * as env from 'env-var';

const Severity = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    critical: 4
};

interface LoggerOptions {
    bufferInclusionLevel?: LogLevel;
    transports: LogTransport[];
}

const ExcludedTypes = [
    Connection
];

class Logger {
    private readonly buffer?: LogEntryBuffer;

    public enabled = env.get('LOGGING_ENABLED', 'true').asBool();

    constructor(
        private readonly options: LoggerOptions) {

        if (options.bufferInclusionLevel)
            this.buffer = new LogEntryBuffer(50);
    }

    public debug(message: string, data?: any): void {
        this.log(LogLevel.Debug, message, data);
    }

    public info(message: string, data?: any): void {
        this.log(LogLevel.Info, message, data);
    }

    public warn(message: string, data?: any): void {
        this.log(LogLevel.Warn, message, data);
    }

    public error(error: Error): void;
    public error(message: string, error?: Error): void;
    public error(messageOrError: string | Error, error?: Error): void {
        let message: string;

        if (messageOrError instanceof Error) {
            message = messageOrError.message;
            error = messageOrError;
        } else {
            message = messageOrError;

            if (error)
                message = `${message}: ${error.message}`;
        }

        this.log(LogLevel.Error, message, error);
    }

    public critical(error: Error): void;
    public critical(message: string, error?: Error): void;
    public critical(messageOrError: string | Error, error?: Error): void {
        let message: string;

        if (messageOrError instanceof Error) {
            message = messageOrError.message;
            error = messageOrError;
        } else {
            message = messageOrError;

            if (error)
                message = `${message}: ${error.message}`;
        }

        this.log(LogLevel.Critical, message, error);
    }

    public async wait(): Promise<void> {
        await Promise.all(this.options.transports.map(t => t.wait()));
    }

    public log(level: LogLevel, message: string, data?: any | Error): void {
        if (!this.enabled)
            return;

        const context = LogContextResolver.resolve();

        const entry: LogEntry = {
            date: new Date(),
            level,
            message,
            context
        };

        if (data)
            if (data instanceof Error)
                entry.error = data;
            else if (data.error instanceof Error) {
                entry.error = data.error;
                delete data.error;
            }
            else
                entry.data = data;

        if (entry.data)
            entry.data = ensureProperties(entry.data, (value) => {
                if (!value.constructor)
                    return false;

                if (ExcludedTypes.includes(value.constructor))
                    return `[${value.constructor.name}]`;

                return false;
            });

        const severity = Severity[level];
        const transports = this.getTransports(severity);

        const bufferLevel = this.options.bufferInclusionLevel;
        let buffer: string[] | undefined;

        if (this.buffer && bufferLevel !== undefined && Severity[bufferLevel] <= severity)
            buffer = this.buffer.get();

        for (const transport of transports)
            transport.log(entry, buffer);

        if (this.buffer)
            this.buffer.add(entry);
    }

    public getBuffer(): string[] {
        if (!this.buffer)
            return [];

        return this.buffer.get();
    }

    public clearBuffer(): void {
        if (!this.buffer)
            return;

        this.buffer.clear();
    }

    public addTransport(transport: LogTransport): void {
        if (this.options.transports.find(t => t instanceof transport.constructor))
            throw new Error(`A transport of type '${transport.constructor.name}' has already been added.`);

        this.options.transports.push(transport);
    }

    public removeTransport<T extends LogTransport>(transportType: new (...args: any[]) => T): void {
        this.options.transports = this.options.transports.filter(t => !(t.constructor === transportType));
    }

    private getTransports(severity: number): LogTransport[] {
        return this.options.transports.filter(t => {
            const transportSeverity = Severity[t.level];

            if (transportSeverity === undefined)
                return false;

            return transportSeverity <= severity;
        });
    }
}

export default new Logger({
    bufferInclusionLevel: LogLevel.Error,
    transports: [
        new ConsoleTransport({
            level: LogLevel.Info
        })
    ]
});