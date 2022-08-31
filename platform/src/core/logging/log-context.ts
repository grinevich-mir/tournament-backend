import { LogOriginator } from './log-originator';

export interface LogContext {
    originator: LogOriginator;
    originatorId?: string;
    application: string;
    region: string;
    request?: any;
}