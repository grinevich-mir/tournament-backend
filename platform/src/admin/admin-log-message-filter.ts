import { PagedFilter } from '../core';
import { AdminLogMessage } from './admin-log-message';

export interface AdminLogMessageFilter extends PagedFilter<AdminLogMessage> {
    createdFrom: string;
    createdTo: string;
    userId?: string;
    page?: number;
    pageSize?: number;
    direction?: 'ASC' | 'DESC';
}