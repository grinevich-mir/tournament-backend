import { Singleton, Inject } from '../core/ioc';
import { SkinRepository } from './repositories';
import { Skin } from './skin';
import { SkinEntityMapper } from './entities/mapper';
import { SkinCache } from './cache';
import { LogClass } from '../core/logging';

@Singleton
@LogClass()
export class SkinManager {
    constructor(
        @Inject private readonly repository: SkinRepository,
        @Inject private readonly cache: SkinCache,
        @Inject private readonly entityMapper: SkinEntityMapper) {
        }

    public async getAll(): Promise<Skin[]> {
        const cached = await this.cache.getAll();

        if (cached)
            return cached || [];

        const entities = await this.repository.getAll();
        const skins = entities.map(e => this.entityMapper.fromEntity(e));

        for (const skin of skins)
            await this.cache.store(skin);

        return skins;
    }

    public async get(id: string): Promise<Skin | undefined> {
        const cached = await this.cache.get(id);

        if (cached)
            return cached;

        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        const skin = this.entityMapper.fromEntity(entity);
        await this.cache.store(skin);
        return skin;
    }

    public async getByUserPoolId(userPoolId: string, cacheOnly?: boolean): Promise<Skin | undefined> {
        const cached = await this.cache.getByUserPoolId(userPoolId);

        if (cached || cacheOnly)
            return cached;

        const entity = await this.repository.getByUserPoolId(userPoolId);

        if (!entity)
            return undefined;

        const skin = this.entityMapper.fromEntity(entity);
        await this.cache.store(skin);
        return skin;
    }
}