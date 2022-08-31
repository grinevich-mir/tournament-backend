import { Singleton, Inject } from '../core/ioc';
import { LeaderboardScheduleEntityMapper, LeaderboardScheduleItemEntityMapper } from './entities/mappers';
import { LeaderboardScheduleRepository } from './repositories/leaderboard-schedule.repository';
import { LeaderboardScheduleFilter } from './leaderboard-schedule-filter';
import { LeaderboardSchedule, NewLeaderboardSchedule, LeaderboardScheduleUpdate } from './leaderboard-schedule';
import { PagedResult } from '../core';
import { LeaderboardScheduleItem, NewLeaderboardScheduleItem } from './leaderboard-schedule-item';
import { LeaderboardScheduleItemFilter } from './leaderboard-schedule-item-filter';

// TODO: Add caching
@Singleton
export class LeaderboardScheduleManager {
    constructor(
        @Inject private readonly repository: LeaderboardScheduleRepository,
        @Inject private readonly scheduleMapper: LeaderboardScheduleEntityMapper,
        @Inject private readonly scheduleItemMapper: LeaderboardScheduleItemEntityMapper) {
        }

    public async getAll(filter?: LeaderboardScheduleFilter): Promise<LeaderboardSchedule[]> {
        const entities = await this.repository.getAll(filter);
        return entities.map(e => this.scheduleMapper.fromEntity(e));
    }

    public async get(name: string): Promise<LeaderboardSchedule | undefined> {
        const entity = await this.repository.get(name);

        if (!entity)
            return undefined;

        return this.scheduleMapper.fromEntity(entity);
    }

    public async add(schedule: NewLeaderboardSchedule): Promise<LeaderboardSchedule> {
        const entity = this.scheduleMapper.newToEntity(schedule);
        const created = await this.repository.add(entity);
        return this.scheduleMapper.fromEntity(created);
    }

    public async update(schedule: LeaderboardScheduleUpdate): Promise<LeaderboardSchedule> {
        const entity = this.scheduleMapper.updateToEntity(schedule);
        const updated = await this.repository.update(entity);
        return this.scheduleMapper.fromEntity(updated);
    }

    public async getItem(id: number): Promise<LeaderboardScheduleItem | undefined> {
        const entity = await this.repository.getItem(id);

        if (!entity)
            return undefined;

        return this.scheduleItemMapper.fromEntity(entity);
    }

    public async getItems(scheduleName: string, filter?: LeaderboardScheduleItemFilter): Promise<PagedResult<LeaderboardScheduleItem>> {
        const result = await this.repository.getItems(scheduleName, filter);
        const items = result.items.map(i => this.scheduleItemMapper.fromEntity(i));
        return new PagedResult(items, result.totalCount, result.page, result.pageSize);
    }

    public async getCurrentItem(scheduleName: string): Promise<LeaderboardScheduleItem | undefined> {
        const entity = await this.repository.getCurrentItem(scheduleName);

        if (!entity)
            return undefined;

        return this.scheduleItemMapper.fromEntity(entity);
    }

    public async getCurrentItems(context?: Date): Promise<LeaderboardScheduleItem[]> {
        const entities = await this.repository.getCurrentItems(context);

        if (entities.length === 0)
            return [];

        return entities.map(e => this.scheduleItemMapper.fromEntity(e));
    }

    public async getEndedItems(finalised?: boolean): Promise<LeaderboardScheduleItem[]> {
        const entities = await this.repository.getEndedItems(finalised);

        if (entities.length === 0)
            return [];

        return entities.map(e => this.scheduleItemMapper.fromEntity(e));
    }

    public async getLastItem(scheduleName: string): Promise<LeaderboardScheduleItem | undefined> {
        const entity = await this.repository.getLastItem(scheduleName);

        if (!entity)
            return undefined;

        return this.scheduleItemMapper.fromEntity(entity);
    }

    public async addItem(item: NewLeaderboardScheduleItem): Promise<LeaderboardScheduleItem> {
        const entity = this.scheduleItemMapper.newToEntity(item);
        const created = await this.repository.addItem(entity);
        return this.scheduleItemMapper.fromEntity(created);
    }

    public async finaliseItem(id: number): Promise<void> {
        await this.repository.finaliseItem(id);
    }
}