import { Singleton, Inject } from '../../core/ioc';
import { UpgradeConfig } from '../upgrade-config';
import { Redis, JsonSerialiser } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { UpgradeLevelConfig } from '../upgrade-level-config';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class UpgradeConfigCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('UPGRADE-CONFIG');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async getAll(): Promise<UpgradeConfig[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (rawItems.length === 0)
            return [];

        return rawItems.map(r => this.serialiser.deserialise(r));
    }

    public async get(skinId: string): Promise<UpgradeConfig | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItem = await this.redis.cluster.hget(cacheKey, skinId);

        if (!rawItem)
            return undefined;

        return this.serialiser.deserialise<UpgradeConfig>(rawItem);
    }

    public async getAllLevel(skinId: string): Promise<UpgradeLevelConfig[]> {
        const cacheKey = this.cacheKeyGenerator.generate(skinId, 'Levels');
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (rawItems.length === 0)
            return [];

        return rawItems.map(r => this.serialiser.deserialise(r));
    }

    public async getForLevel(skinId: string, level: number): Promise<UpgradeLevelConfig | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate(skinId, 'Levels');
        const rawItem = await this.redis.cluster.hget(cacheKey, level.toString());

        if (!rawItem)
            return undefined;

        return this.serialiser.deserialise<UpgradeLevelConfig>(rawItem);
    }

    public async store(...configs: UpgradeConfig[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        for (const config of configs)
            await this.redis.cluster.hset(cacheKey, config.skinId, this.serialiser.serialise(config));
    }

    public async storeLevel(...configs: UpgradeLevelConfig[]): Promise<void> {
        for (const config of configs) {
            const cacheKey = this.cacheKeyGenerator.generate(config.skinId, 'Levels');
            await this.redis.cluster.hset(cacheKey, config.level.toString(), this.serialiser.serialise(config));
        }
    }
}