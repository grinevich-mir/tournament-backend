import { WalletEntryRepository } from './repositories';
import { Inject, Singleton } from '../core/ioc';
import { WalletEntryFilter } from './wallet-entry-filter';
import { WalletEntryEntityMapper } from './entities/mappers';
import { WalletEntry } from './wallet-entry';
import { LogClass } from '../core/logging';
import { PagedResult } from '../core';

@Singleton
@LogClass()
export class WalletEntryManager {
    constructor(
        @Inject private readonly repository: WalletEntryRepository,
        @Inject private readonly entityMapper: WalletEntryEntityMapper) {
        }

    public async getAll(filter?: WalletEntryFilter): Promise<PagedResult<WalletEntry>> {
        const result = await this.repository.getAll(filter);
        const entries = result.items.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(entries, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: number): Promise<WalletEntry | undefined> {
        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }
}