import { Singleton, Inject } from '../core/ioc';
import { WalletRepository } from './repositories';
import { WalletFilter } from './wallet-filter';
import { WalletEntityMapper } from './entities/mappers';
import { Wallet, UserWallet, PlatformWallet } from './wallet';
import { PlatformWallets } from './platform-wallets';
import { WalletAccountManager } from './wallet-account-manager';
import { LogClass } from '../core/logging';
import { PagedResult } from '../core';

@Singleton
@LogClass()
export class WalletManager {
    constructor(
        @Inject private readonly walletRepository: WalletRepository,
        @Inject private readonly walletAccountManager: WalletAccountManager,
        @Inject private readonly walletEntityMapper: WalletEntityMapper) {
        }

    public async getAll(filter?: WalletFilter): Promise<PagedResult<Wallet>> {
        const result = await this.walletRepository.getAll(filter);
        const wallets = result.items.map(e => this.walletEntityMapper.fromEntity(e));
        return new PagedResult(wallets, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: number): Promise<Wallet | undefined> {
        const entity = await this.walletRepository.get(id);

        if (!entity)
            return undefined;

        return this.walletEntityMapper.fromEntity(entity);
    }

    public async getForUser(userId: number): Promise<UserWallet | undefined> {
        const entity = await this.walletRepository.getForUser(userId);

        if (!entity)
            return undefined;

        return this.walletEntityMapper.fromEntity(entity) as UserWallet;
    }

    public async getForPlatform(wallet: PlatformWallets): Promise<PlatformWallet | undefined> {
        const entity = await this.walletRepository.getForPlatform(wallet);

        if (!entity)
            return undefined;

        return this.walletEntityMapper.fromEntity(entity) as PlatformWallet;
    }

    public async addForUser(userId: number, currencyCode?: string): Promise<UserWallet> {
        const entity = await this.walletRepository.addForUser(userId);
        await this.walletAccountManager.addUserDefaults(entity.id, currencyCode);
        return this.walletEntityMapper.fromEntity(entity) as UserWallet;
    }

    public async addForPlatform(name: string): Promise<PlatformWallet> {
        const entity = await this.walletRepository.addForPlatform(name);
        return this.walletEntityMapper.fromEntity(entity) as PlatformWallet;
    }
}