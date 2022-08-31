import { WalletTransactionRepository } from './repositories';
import { Inject, Singleton } from '../core/ioc';
import { WalletTransactionEntityMapper } from './entities/mappers';
import { WalletTransactionFilter } from './wallet-transaction-filter';
import { WalletTransaction } from './wallet-transaction';
import { LogClass } from '../core/logging';
import { PagedResult } from '../core';

@Singleton
@LogClass()
export class WalletTransactionManager {
    constructor(
        @Inject private readonly repository: WalletTransactionRepository,
        @Inject private readonly entityMapper: WalletTransactionEntityMapper) {
        }

    public async getAll(filter?: WalletTransactionFilter): Promise<PagedResult<WalletTransaction>> {
        const result = await this.repository.getAll(filter);
        const transactions = result.items.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(transactions, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: number): Promise<WalletTransaction | undefined> {
        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }
}