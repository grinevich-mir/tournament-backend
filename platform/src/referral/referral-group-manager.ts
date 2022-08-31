import { NotFoundError } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { ReferralGroup, ReferralGroupUpdate } from './referral-group';
import { ReferralGroupRepository } from './repositories';
import { ReferralGroupCache } from './cache';

@Singleton
@LogClass()
export class ReferralGroupManager {
    constructor(
        @Inject private readonly repository: ReferralGroupRepository,
        @Inject private readonly cache: ReferralGroupCache) {
        }

    public async getAll(): Promise<ReferralGroup[]> {
        const cachedItems = await this.cache.getAll();

        if (cachedItems.length > 0)
            return cachedItems;

        const groups = await this.repository.getAll();
        await this.cache.store(...groups);
        return groups;
    }

    public async get(id: number): Promise<ReferralGroup | undefined> {
        const cachedItem = await this.cache.get(id);

        if (cachedItem)
            return cachedItem;

        const group = await this.repository.get(id);

        if (!group)
            return undefined;

        await this.cache.store(group);
        return group;
    }

    public async add(name: string): Promise<ReferralGroup> {
        const group = await this.repository.add(name);
        await this.cache.store(group);

        if (group.default)
            await this.cache.storeDefault(group);

        return group;
    }

    public async update(id: number, group: ReferralGroupUpdate): Promise<ReferralGroup> {
        const updated = await this.repository.update(id, group);
        await this.cache.store(updated);
        return updated;
    }

    public async remove(id: number): Promise<void> {
        const group = await this.get(id);

        if (!group)
            throw new NotFoundError('Group not found.');

        await this.repository.remove(id);
        await this.cache.remove(id);
    }

    public async getDefault(): Promise<ReferralGroup> {
        const cachedItem = await this.cache.getDefault();

        if (cachedItem)
            return cachedItem;

        const group = await this.repository.getDefault();

        if (!group)
            throw new NotFoundError('Default referral group not found.');

        await this.cache.storeDefault(group);
        return group;
    }

    public async setDefault(id: number): Promise<void> {
        const group = await this.get(id);

        if (!group)
            throw new NotFoundError('Target default group does not exist.');

        await this.repository.setDefault(id);
        group.default = true;
        group.updateTime = new Date();
        const groups = await this.getAll();

        groups.forEach(g => {
            g.default = g.id === id;
            g.updateTime = new Date();
        });

        await this.cache.store(...groups);
        await this.cache.storeDefault(group);
    }
}