import { LogOriginator, LogType, UserLogMessage } from '../core/logging';
import { PagedFilter } from '../core';

export interface UserLogMessageFilter extends PagedFilter<UserLogMessage> {
    userId?: number;
    type?: LogType;
    originator?: LogOriginator;
    originatorId?: string;
    application?: string;
    action?: string;
    createdFrom?: Date;
    createdTo?: Date;
}
