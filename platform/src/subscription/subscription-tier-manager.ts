import { Singleton, Inject } from '../core/ioc';
import { SubscriptionTierRepository } from './repositories';
import { SubscriptionTier } from './subscription-tier';
import { SubscriptionTierEntityMapper } from './entities/mappers';
import { SubscriptionTierFilter } from './subscription-tier-filter';
import { LogClass } from '../core/logging';

// TODO: Add caching
@Singleton
@LogClass()
export class SubscriptionTierManager {
    constructor(
        @Inject private readonly repository: SubscriptionTierRepository,
        @Inject private readonly entityMapper: SubscriptionTierEntityMapper) {
        }

    public async getAll(filter?: SubscriptionTierFilter): Promise<SubscriptionTier[]> {
        const entities = await this.repository.getAll(filter);
        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async get(id: number): Promise<SubscriptionTier | undefined> {
        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getByCode(skinId: string, code: string): Promise<SubscriptionTier | undefined> {
        const entity = await this.repository.getByCode(skinId, code);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getByLevel(skinId: string, level: number): Promise<SubscriptionTier | undefined> {
        const entity = await this.repository.getByLevel(skinId, level);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }
}