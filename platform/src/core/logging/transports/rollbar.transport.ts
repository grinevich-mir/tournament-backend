import Rollbar, { Configuration as RollbarConfiguration } from 'rollbar';
import { LogOriginator } from '../log-originator';
import { LogTransportOptions, LogTransport } from './log-transport';
import { LogEntry } from '../log-entry';
import { LogLevel } from '../log-level';

export interface RollbarTransportOptions extends LogTransportOptions {
    rollbarConfig: RollbarConfiguration;
}

export class RollbarTransport extends LogTransport<RollbarTransportOptions> {
    private readonly rollbar: Rollbar;

    constructor(options: RollbarTransportOptions) {
        super(options);
        this.rollbar = new Rollbar(options.rollbarConfig);
    }

    private performLogging(level: string, ...args: any[]) {
        const logMethod = (this.rollbar as any)[level];
        if (logMethod)
            logMethod.apply(this.rollbar, args);
        else {
            if (!args[2])
                args[2] = {};

            args[2].logLevel = level;
            this.rollbar.log(...args);
        }
    }

    public log(entry: LogEntry, buffer: string[]): void {
        const msg = entry.message;
        const error = entry.error;
        const request = entry.context ? entry.context.request : undefined;

        const payload: any = {
            region: entry.context.region,
            originator: entry.context.originator,
            originatorId: entry.context.originatorId,
            application: entry.context.application
        };

        if (buffer)
            payload.logBuffer = buffer;

        if (entry.context.originator === LogOriginator.User && entry.context.originatorId !== 'Anonymous')
            payload.person = {
                id: entry.context.originatorId
            };

        if (entry.data)
            payload.data = entry.data;

        const level = this.mapLevel(entry.level);
        this.performLogging(level, msg, error, request, payload);
    }

    public wait(): Promise<void> {
        return new Promise((resolve) => this.rollbar.wait(resolve));
    }

    private mapLevel(level: LogLevel): string {
        switch (level) {
            default:
                return level;

            case LogLevel.Warn:
                return 'warning';
        }
    }
}