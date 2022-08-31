import { UpgradeConfig } from './upgrade-config';
import { Singleton, Inject } from '../core/ioc';
import { UpgradeConfigRepository } from './repositories';
import { UpgradeConfigEntityMapper } from './entities/mappers';
import { UpgradeLevelConfig } from './upgrade-level-config';
import { UpgradeConfigCache } from './cache';
import { LogClass } from '../core/logging';

@Singleton
@LogClass()
export class UpgradeConfigManager {
    constructor(
        @Inject private readonly cache: UpgradeConfigCache,
        @Inject private readonly repository: UpgradeConfigRepository,
        @Inject private readonly entityMapper: UpgradeConfigEntityMapper) {
        }

    public async getAll(): Promise<UpgradeConfig[]> {
        const cached = await this.cache.getAll();

        if (cached.length > 0)
            return cached;

        const entities = await this.repository.getAll();
        const configs = entities.map(e => this.entityMapper.fromEntity(e));
        await this.cache.store(...configs);
        return configs;
    }

    public async get(skinId: string): Promise<UpgradeConfig | undefined> {
        const cached = await this.cache.get(skinId);

        if (cached)
            return cached;

        const configs = await this.getAll();
        return configs.find(c => c.skinId === skinId);
    }

    public async getAllLevel(skinId: string): Promise<UpgradeLevelConfig[]> {
        const cached = await this.cache.getAllLevel(skinId);

        if (cached.length > 0)
            return cached;

        const entities = await this.repository.getAllLevel(skinId);
        const configs = entities.map(e => this.entityMapper.levelFromEntity(e));
        await this.cache.storeLevel(...configs);
        return configs;
    }

    public async getForLevel(skinId: string, level: number): Promise<UpgradeLevelConfig | undefined> {
        const cached = await this.cache.getForLevel(skinId, level);

        if (cached)
            return cached;

        const configs = await this.getAllLevel(skinId);
        return configs.find(c => c.skinId === skinId);
    }
}