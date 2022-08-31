import { LogLevel } from './log-level';
import { LogContext } from './log-context';

export interface LogEntry {
    date: Date;
    level: LogLevel;
    message: string;
    error?: Error;
    context: LogContext;
    data?: any;
}