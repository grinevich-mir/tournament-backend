import { AdminController, Route, Tags, Security, Get, Query, Path, Put } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { UpgradeCode, UpgradeCodeFilter, UpgradeCodeManager } from '@tcom/platform/lib/upgrade';

@Tags('Code')
@Route('upgrade/code')
@LogClass()
export class CodeController extends AdminController {
    constructor(
        @Inject private readonly manager: UpgradeCodeManager) {
        super();
    }

    /**
     * @summary Gets all upgrade codes
     */
    @Get()
    @Security('admin', ['upgrade:read'])
    public async getAll(
        @Query() userId?: number,
        @Query() processed?: boolean,
        @Query() expired?: boolean,
        @Query() page: number = 1,
        @Query() pageSize: number = 30): Promise<PagedResult<UpgradeCode>> {
        const filter: UpgradeCodeFilter = {
            userId,
            processed,
            expired,
            page,
            pageSize
        };

        return this.manager.getAll(filter);
    }

    /**
     * @summary Gets an upgrade code
     */
    @Get('{code}')
    @Security('admin', ['upgrade:read'])
    public async get(@Path() code: string): Promise<UpgradeCode> {
        const item = await this.manager.get(code);

        if (!item)
            throw new NotFoundError('Upgrade code not found.');

        return item;
    }

    /**
     * @summary Processes an upgrade code
     */
    @Put('{code}')
    @Security('admin', ['upgrade:write'])
    public async process(@Path() code: string): Promise<UpgradeCode> {
        return this.manager.process(code, this.user.id);
    }
}
