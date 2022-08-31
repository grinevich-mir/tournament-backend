import { AdminController, Get, Route, Tags, Path, Query, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { TransactionPurpose, WalletEntryFilter, WalletEntry, WalletManager, WalletEntryManager } from '@tcom/platform/lib/banking';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Entries')
@Route('banking/entry')
@Security('admin', ['banking:wallet:entry:read'])
@LogClass()
export class WalletEntryController extends AdminController {
    constructor(
        @Inject private readonly walletManager: WalletManager,
        @Inject private readonly entryManager: WalletEntryManager) {
        super();
    }

    /**
     * @summary Gets all wallet entries
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    public async getAll(
        @Query() accountId?: number,
        @Query() walletId?: number,
        @Query() purpose?: TransactionPurpose,
        @Query() from?: Date,
        @Query() to?: Date,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<WalletEntry>> {
        const filter: WalletEntryFilter = {
            accountId,
            walletId,
            purpose,
            from,
            to,
            page,
            pageSize
        };

        return this.entryManager.getAll(filter);
    }

    /**
     * @summary Gets all wallet entries for a user
     * @isInt page
     * @isInt pageSize
     */
    @Get('user/{userId}')
    public async getForUser(
        @Path() userId: number,
        @Query() accountId?: number,
        @Query() purpose?: TransactionPurpose,
        @Query() from?: Date,
        @Query() to?: Date,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<WalletEntry>> {
        const wallet = await this.walletManager.getForUser(userId);

        if (!wallet)
            throw new NotFoundError('Wallet not found.');

        const filter: WalletEntryFilter = {
            walletId: wallet.id,
            accountId,
            purpose,
            from,
            to,
            page,
            pageSize
        };

        return this.entryManager.getAll(filter);
    }

    /**
     * @summary Gets a wallet entry by ID
     */
    @Get('{id}')
    public async getById(@Path() id: number): Promise<WalletEntry> {
        const entry = await this.entryManager.get(id);

        if (!entry)
            throw new NotFoundError('Entry not found.');

        return entry;
    }
}
