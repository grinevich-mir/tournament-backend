import { Singleton, Inject } from '../core/ioc';
import { PagedResult, ForbiddenError, NotFoundError, BadRequestError } from '../core';
import { LeaderboardInfo } from './leaderboard-info';
import { Leaderboard } from './leaderboard';
import { LeaderboardAdjustment } from './leaderboard-adjustment';
import { LeaderboardEntry } from './leaderboard-entry';
import { NewLeaderboard } from './new-leaderboard';
import { LeaderboardRepository } from './repositories';
import { LeaderboardPrizeAwarder } from './leaderboard-prize-awarder';
import Logger, { LogClass } from '../core/logging';
import _ from 'lodash';
import { LeaderboardPrizeAward } from './leaderboard-prize-award';
import { LeaderboardEntityMapper } from './entities/mappers';
import { LeaderboardEntryEntity } from './entities';
import { RankedPrize } from '../prize';
import { LeaderboardCache } from './cache';
import moment from 'moment';
import { LeaderboardAdjustmentResult } from './leaderboard-adjustment-result';

@Singleton
@LogClass()
export class LeaderboardManager {
    constructor(
        @Inject private readonly repository: LeaderboardRepository,
        @Inject private readonly prizeAwarder: LeaderboardPrizeAwarder,
        @Inject private readonly entityMapper: LeaderboardEntityMapper,
        @Inject private readonly cache: LeaderboardCache) {
    }

    public async add(newLeaderboard: NewLeaderboard): Promise<LeaderboardInfo> {
        const entity = this.entityMapper.newToEntity(newLeaderboard);
        const created = await this.repository.add(entity);

        const info = this.entityMapper.infoFromEntity(created);

        await this.cache.store(info);
        await this.cache.addToIndex(info);
        return info;
    }

    public async exists(id: number, cacheOnly: boolean = false): Promise<boolean> {
        const inCache = await this.cache.exists(id);

        if (cacheOnly)
            return inCache;

        return inCache || this.repository.exists(id);
    }

    public async updatePrizes(id: number, prizes: RankedPrize[]): Promise<void> {
        const leaderboard = await this.getInfo(id);

        if (!leaderboard)
            throw new NotFoundError('Leaderboard not found.');

        if (leaderboard.payoutTime)
            throw new BadRequestError('Leaderboard has already been paid out.');

        prizes = _.sortBy(prizes, p => p.startRank);

        const entities = prizes.map(p => this.entityMapper.prizeToEntity(id, p));
        await this.repository.updatePrizes(id, entities);

        if (!await this.cache.exists(id))
            return;

        leaderboard.prizes = prizes;
        await this.cache.store(leaderboard);
    }

    public async remove(id: number): Promise<void> {
        if (!await this.exists(id))
            throw new NotFoundError('Leaderboard does not exist.');

        await this.repository.remove(id);
        await this.cache.remove(id);
    }

    public async reset(id: number): Promise<void> {
        const info = await this.getInfo(id);

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        if (info.finalised)
            throw new ForbiddenError('Cannot reset leaderboard as it has been finalised.');

        await this.repository.reset(id);
        await this.cache.reset(id);
    }

    public async finalise(id: number): Promise<void> {
        const info = await this.getInfo(id);

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        if (info.finalised)
            throw new ForbiddenError('Leaderboard has already been finalised.');

        await this.repository.finalise(id);

        info.finalised = true;

        await this.cache.store(info);
        await this.cache.removeFromIndex(id);
        await this.repository.updateRanks(id);
    }

    public async expire(id: number, expireTime: Date | number): Promise<void> {
        await this.cache.expire(id, expireTime);
    }

    public async getActive(page: number = 1, pageSize: number = 100): Promise<PagedResult<LeaderboardInfo>> {
        return this.cache.getActive(page, pageSize);
    }

    public async getInactive(page: number = 1, pageSize: number = 100): Promise<PagedResult<LeaderboardInfo>> {
        const result = await this.repository.getAll({
            page,
            pageSize,
            finalised: true,
            order: {
                createTime: 'DESC'
            }
        });

        const leaderboards = result.items.map(l => this.entityMapper.infoFromEntity(l));
        return new PagedResult(leaderboards, result.totalCount, result.page, result.pageSize);
    }

    public async getInfo(id: number): Promise<LeaderboardInfo | undefined> {
        const info = await this.cache.getInfo(id);

        if (info)
            return info;

        const entity = await this.repository.getInfo(id);

        if (!entity)
            return undefined;

        return this.entityMapper.infoFromEntity(entity);
    }

    public async get(id: number, skip: number = 0, take: number = 100, userId?: number): Promise<Leaderboard | undefined> {
        let leaderboard = await this.cache.get(id, skip, take);

        if (!leaderboard) {
            const entity = await this.repository.get(id, skip, take);

            if (!entity)
                return;

            leaderboard = this.entityMapper.fromEntity(entity);
        }

        if (!leaderboard)
            return;

        if (userId && !leaderboard.entries.some(e => e.userId === userId))
            leaderboard.userEntry = await this.getEntry(id, userId);

        return leaderboard;
    }

    public async getEntriesByRank(id: number, min?: number, max?: number): Promise<LeaderboardEntry[]> {
        return this.cache.getEntriesByRank(id, min, max);
    }

    public async getAroundUser(id: number, userId: number, count: number): Promise<Leaderboard | undefined> {
        return this.cache.getAroundUser(id, userId, count);
    }

    public async getEntriesByPoints(id: number, min: number | string, max?: number | string): Promise<LeaderboardEntry[]> {
        return this.cache.getEntriesByPoints(id, min, max);
    }

    public async knockoutByPoints(id: number, minPoints: number): Promise<[LeaderboardEntry[], number]> {
        const info = await this.cache.getInfo(id);

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        if (info.finalised)
            throw new ForbiddenError('Cannot knockout entries from leaderboard as it has been finalised.');

        console.log('GETTING KNOCKOUT ENTRIES');
        const knockOutEntries = await this.getEntriesByPoints(id, '-inf', minPoints);
        console.log('KNOCKOUT ENTRIES', knockOutEntries.length);

        const userIds = knockOutEntries.map(p => p.userId);
        await this.removeEntries(id, userIds);
        const remainingCount = await this.cache.countEntries(id);
        return [knockOutEntries, remainingCount];
    }

    public async adjustPoints(id: number, ...adjustments: LeaderboardAdjustment[]): Promise<LeaderboardAdjustmentResult[]> {
        const results = await this.cache.adjustPoints(id, adjustments);

        if (results.length === 0)
            return [];

        const entities = results.map(r => {
            const entity = new LeaderboardEntryEntity();
            entity.leaderboardId = id;
            entity.userId = r.userId;
            entity.points = r.points;
            entity.tieBreaker = r.tieBreaker;
            entity.runningPoints = r.runningPoints;
            entity.runningTieBreaker = r.runningTieBreaker;
            return entity;
        });

        const entries = entities.map(e => this.entityMapper.entryFromEntity(e));
        await this.cache.updateActive(id, entries);

        await this.repository.saveEntries(entities);
        return results;
    }

    public async addEntry(id: number, userId: number): Promise<LeaderboardEntry> {
        if (await this.entryExists(id, userId))
            throw new ForbiddenError('Entry already exists.');

        await this.addEntries(id, [userId]);
        return await this.getEntry(id, userId) as LeaderboardEntry;
    }

    public async addEntries(id: number, userIds: number[]): Promise<void> {
        if (!await this.cache.exists(id))
            throw new NotFoundError('Leaderboard not found.');

        await this.repository.addEntries(id, userIds);
        await this.cache.addEntries(id, userIds);
    }

    public async getEntry(leaderboardId: number, userId: number): Promise<LeaderboardEntry | undefined> {
        const leaderboardInCache = await this.cache.exists(leaderboardId);

        if (leaderboardInCache)
            return this.cache.getEntry(leaderboardId, userId);

        const entity = await this.repository.getEntry(leaderboardId, userId);

        if (!entity)
            return undefined;

        return this.entityMapper.entryFromEntity(entity);
    }

    public async entryExists(leaderboardId: number, userId: number): Promise<boolean> {
        const leaderboardInCache = await this.cache.exists(leaderboardId);

        if (leaderboardInCache)
            return this.cache.entryExists(leaderboardId, userId);

        return this.repository.entryExists(leaderboardId, userId);
    }

    public async removeEntry(leaderboardId: number, userId: number): Promise<void> {
        await this.removeEntries(leaderboardId, [userId]);
    }

    public async removeEntries(leaderboardId: number, userIds: number[]): Promise<void> {
        if (!await this.cache.exists(leaderboardId))
            throw new NotFoundError('Leaderboard does not exist.');

        await this.repository.removeEntries(leaderboardId, userIds);
        await this.cache.removeEntries(leaderboardId, userIds);
    }

    public async countEntries(id: number): Promise<number> {
        return this.cache.countEntries(id);
    }

    public async payout(id: number): Promise<LeaderboardPrizeAward[]> {
        const info = await this.cache.getInfo(id);

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        if (!info.finalised)
            throw new ForbiddenError('Leaderboard must be finalised before payout.');

        if (info.payoutTime)
            throw new ForbiddenError('Leaderboard has already been paid out.');

        const prizes = info.prizes;

        if (!prizes || prizes.length === 0) {
            Logger.error(`Leaderboard '${id}' has no prizes, no prizes will be awarded.`);
            return [];
        }

        const maxRankPrize = _.maxBy(prizes, p => p.endRank) as RankedPrize;
        const entries = await this.cache.getEntriesByRank(id, 1, maxRankPrize.endRank);

        if (entries.length === 0)
            return [];

        if (entries.every(p => p.points === 0))
            return [];

        const results: LeaderboardPrizeAward[] = [];

        for (const entry of entries) {
            if (entry.points === 0)
                continue;

            const entryPrizes = prizes.filter(p => entry.rank >= p.startRank && entry.rank <= p.endRank);
            const award = await this.prizeAwarder.award(id, entry.userId, entry.rank, ...entryPrizes);
            results.push(award);
        }

        info.payoutTime = new Date();
        await this.repository.setPayoutTime(id, info.payoutTime);
        await this.cache.store(info);
        return results;
    }

    public async restoreCache(id: number, restoreEntries: boolean = false): Promise<void> {
        const entity = await this.repository.get(id);

        if (!entity)
            throw new NotFoundError('Leaderboard not found.');

        const info = this.entityMapper.infoFromEntity(entity);
        await this.cache.store(info);

        if (restoreEntries) {
            const entries = entity.entries.map(e => this.entityMapper.entryFromEntity(e));
            await this.cache.storeEntries(id, entries);
        }

        if (!info.finalised)
            return;

        const expireTime = moment().utc().add(3, 'days').toDate();
        await this.cache.expire(id, expireTime);
    }
}