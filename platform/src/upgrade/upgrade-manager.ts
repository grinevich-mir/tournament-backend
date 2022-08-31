import { Singleton, Inject } from '../core/ioc';
import { UpgradeRepository } from './repositories';
import { UpgradeEntityMapper } from './entities/mappers';
import { Upgrade } from './upgrade';
import { UpgradeFilter } from './upgrade-filter';
import { PagedResult } from '../core';

@Singleton
export class UpgradeManager {
    constructor(
        @Inject private readonly repository: UpgradeRepository,
        @Inject private readonly mapper: UpgradeEntityMapper) {
        }

    public async getAll(filter?: UpgradeFilter): Promise<PagedResult<Upgrade>> {
        const entities = await this.repository.getAll(filter);
        const upgrades = entities.items.map(e => this.mapper.fromEntity(e));
        return new PagedResult(upgrades, entities.totalCount, entities.page, entities.pageSize);
    }
}