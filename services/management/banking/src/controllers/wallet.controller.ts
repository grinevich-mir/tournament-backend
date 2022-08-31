import { AdminController, Get, Route, Tags, Path, Query, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { WalletType, PlatformWallets, WalletFlow, WalletManager, WalletFilter, Wallet, PlatformWallet, UserWallet } from '@tcom/platform/lib/banking';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Wallets')
@Route('banking/wallet')
@Security('admin', ['banking:wallet:read'])
@LogClass()
export class WalletController extends AdminController {
    constructor(
        @Inject private readonly manager: WalletManager) {
        super();
    }

    /**
     * @summary Gets all wallets
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    public async getAll(
        @Query() type?: WalletType,
        @Query() name?: PlatformWallets,
        @Query() flow?: WalletFlow,
        @Query() userId?: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Wallet>> {
        const filter: WalletFilter = {
            type,
            name,
            flow,
            userId,
            page,
            pageSize
        };

        return this.manager.getAll(filter);
    }

    /**
     * @summary Gets all platform wallets
     * @isInt page
     * @isInt pageSize
     */
    @Get('platform')
    public async getAllPlatform(
        @Query() name?: PlatformWallets,
        @Query() flow?: WalletFlow,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Wallet>> {
        const filter: WalletFilter = {
            type: WalletType.Platform,
            name,
            flow,
            page,
            pageSize
        };

        return this.manager.getAll(filter);
    }

    /**
     * @summary Gets a platform wallet
     */
    @Get('platform/{name}')
    public async getForPlatform(@Path() name: PlatformWallets): Promise<PlatformWallet> {
        const wallet = await this.manager.getForPlatform(name);

        if (!wallet)
            throw new NotFoundError('Wallet not found.');

        return wallet;
    }

    /**
     * @summary Gets all user wallets
     * @isInt page
     * @isInt pageSize
     */
    @Get('user')
    public async getAllUser(
        @Query() userId?: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Wallet>> {
        const filter: WalletFilter = {
            type: WalletType.User,
            userId,
            page,
            pageSize
        };

        return this.manager.getAll(filter);
    }

    /**
     * @summary Gets a user wallet
     */
    @Get('user/{userId}')
    public async getForUser(@Path() userId: number): Promise<UserWallet> {
        const wallet = await this.manager.getForUser(userId);

        if (!wallet)
            throw new NotFoundError('Wallet not found.');

        return wallet;
    }

    /**
     * @summary Gets a wallet by ID
     */
    @Get('{id}')
    public async get(@Path() id: number): Promise<Wallet> {
        const wallet = await this.manager.get(id);

        if (!wallet)
            throw new NotFoundError('Wallet not found.');

        return wallet;
    }
}
