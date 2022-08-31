import { AdminController, Get, Route, Tags, Security, Query } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PagedResult } from '@tcom/platform/lib/core';
import { AdminLogRepository } from '@tcom/platform/lib/admin/repositories';
import { AdminLogMessage } from '@tcom/platform/lib/admin/admin-log-message';
import { AdminLogMessageFilter } from '@tcom/platform/lib/admin/admin-log-message-filter';

@Tags('Admin Logs')
@Route('admin/logs')
@Security('admin')
@LogClass()
export class AdminLogController extends AdminController {
    constructor(@Inject private readonly adminLogRepository: AdminLogRepository) {
        super();
    }

    /**
     * @summary Get all admin logs
     */
    @Get()
    @Security('admin', ['admin:logs:read'])
    public async getAll(
        @Query() createdFrom: string,
        @Query() createdTo: string,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() userId?: string,
        @Query() direction?: 'ASC' | 'DESC',
    ): Promise<PagedResult<AdminLogMessage>> {

        const filter: AdminLogMessageFilter = {
            createdFrom,
            createdTo,
            userId,
            page,
            pageSize,
            direction,
        };

        const adminLog = await this.adminLogRepository.getAll(filter);

        return adminLog;
    }

}