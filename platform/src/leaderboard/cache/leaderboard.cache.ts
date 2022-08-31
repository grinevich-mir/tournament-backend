import { Singleton, Inject } from '../../core/ioc';
import { CacheKeyResolver, LeaderboardMapper, PointsFormatter } from '../utilities';
import { JsonSerialiser, Redis, PagedResult, NotFoundError } from '../../core';
import { LeaderboardInfo } from '../leaderboard-info';
import moment from 'moment';
import { Leaderboard } from '../leaderboard';
import { LeaderboardEntry } from '../leaderboard-entry';
import { LeaderboardAdjustment } from '../leaderboard-adjustment';
import Logger from '../../core/logging';
import { LeaderboardAdjustmentResult } from '../leaderboard-adjustment-result';

@Singleton
export class LeaderboardCache {
    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser,
        @Inject private readonly mapper: LeaderboardMapper,
        @Inject private readonly pointFormatter: PointsFormatter,
        @Inject private readonly cacheKeyResolver: CacheKeyResolver) {
    }

    public async getActive(page: number = 1, pageSize: number = 100): Promise<PagedResult<LeaderboardInfo>> {
        const rawIds: string[] = await this.redis.cluster.zrevrangebyscore(this.cacheKeyResolver.index, '+inf', '-inf');
        const removed: number[] = [];

        if (!rawIds || rawIds.length === 0)
            return new PagedResult([], 0, 1, pageSize);

        let ids = rawIds.map(i => Number(i));

        for (const id of ids) {
            const exists = await this.exists(id);

            if (exists)
                continue;

            removed.push(id);
        }

        if (removed.length > 0) {
            await this.removeFromIndex(...removed);
            ids = ids.filter(n => !removed.includes(n));
        }

        const count = ids.length;

        if (page < 1)
            page = 1;

        const pageIndex = page - 1;
        ids = ids.slice(pageIndex * pageSize, page * pageSize);

        const leaderboards: LeaderboardInfo[] = [];

        for (const id of ids) {
            const info = await this.getInfo(id) as LeaderboardInfo;
            info.entryCount = await this.countEntries(info.id);
            leaderboards.push(info);
        }

        return new PagedResult(leaderboards, count, page, pageSize);
    }

    public async getInfo(id: number): Promise<LeaderboardInfo | undefined> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        const rawInfo = await this.redis.cluster.get(cacheKeys.info);

        if (!rawInfo) {
            await this.removeFromIndex(id);
            return undefined;
        }

        const data = this.serialiser.deserialise<LeaderboardInfo>(rawInfo);
        data.entryCount = await this.countEntries(id);
        return data;
    }

    public async get(id: number, skip: number = 0, take: number = 100): Promise<Leaderboard | undefined> {
        const info = await this.getInfo(id);

        if (!info)
            return;

        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        const data: string[] = await this.redis.cluster.zrevrange(cacheKeys.entries, skip, skip + (take - 1), 'WITHSCORES');
        return this.mapper.map(info, data);
    }

    public async getEntriesByRank(id: number, min?: number, max?: number): Promise<LeaderboardEntry[]> {
        if (!await this.exists(id))
            throw new NotFoundError('Leaderboard not found.');

        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);

        const minRank = min === undefined || min < 0 ? 0 : min - 1;
        const maxRank = max === undefined || max < 0 ? -1 : max - 1;

        const data = await this.redis.cluster.zrevrange(cacheKeys.entries, minRank, maxRank, 'WITHSCORES');
        return this.mapper.mapEntries(id, data);
    }

    public async getAroundUser(id: number, userId: number, count: number): Promise<Leaderboard | undefined> {
        const info = await this.getInfo(id);

        if (!info)
            return undefined;

        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);

        const rank = await this.redis.cluster.zrevrank(cacheKeys.entries, userId.toString());

        if (rank === null)
            return undefined;

        const totalCount = info.entryCount;
        const requestedCount = (count * 2) + 1;
        let startRank = Math.max(rank - Math.floor(requestedCount / 2), 0);
        let endRank = (startRank + requestedCount) - 1;
        const maxRank = totalCount - 1;

        if (maxRank <= endRank) {
            endRank = totalCount;
            startRank = Math.max(endRank - requestedCount, 0);
        }

        const data = await this.redis.cluster.zrevrange(cacheKeys.entries, startRank, endRank, 'WITHSCORES');
        return this.mapper.map(info, data);
    }

    public async getEntriesByPoints(id: number, min: number | string, max?: number | string): Promise<LeaderboardEntry[]> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        max = max || '+inf';
        const data = await this.redis.cluster.zrangebyscore(cacheKeys.entries, min, max, 'WITHSCORES');
        return this.mapper.mapEntries(id, data);
    }

    public async adjustPoints(id: number, adjustments: LeaderboardAdjustment[]): Promise<LeaderboardAdjustmentResult[]> {
        if (adjustments.length === 0)
            return [];

        const info = await this.getInfo(id);

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        if (info.finalised) {
            Logger.warn(`Leaderboard ${id} has been finalised and points cannot be adjusted.`);
            return [];
        }

        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        const cacheExists = await this.redis.cluster.exists(cacheKeys.entries);

        if (!cacheExists)
            return [];

        const results: LeaderboardAdjustmentResult[] = [];

        Logger.info(`Leaderboard ${id}: Adjusting points`, adjustments);

        for (const adjustment of adjustments) {
            const entryLockKey = `${cacheKeys.entries}:${adjustment.userId}`;
            await this.redis.lock(entryLockKey, async () => {
                const rawHighPoints = await this.redis.cluster.zscore(cacheKeys.entries, adjustment.userId.toString());

                if (rawHighPoints === null)
                    return;

                let rawRunningPoints = await this.redis.cluster.zscore(cacheKeys.runningEntries, adjustment.userId.toString());

                if (rawRunningPoints === null)
                    rawRunningPoints = rawHighPoints;

                let [highPoints, highPointsTieBreaker] = this.pointFormatter.parse(rawHighPoints);
                const runningData = this.pointFormatter.parse(rawRunningPoints);
                let runningPoints = runningData[0];
                const runningPointsTieBreaker = runningData[1];
                let tieBreaker = this.pointFormatter.getTieBreaker(adjustment.tieBreaker);

                const prevHighPoints = highPoints;
                const prevRunningPoints = runningPoints;

                if (adjustment.reset === 'All')
                    highPoints = runningPoints = 0;

                if (adjustment.points === 0)
                    tieBreaker = runningPointsTieBreaker;
                else
                    runningPoints += adjustment.points;

                const pipeline = this.redis.cluster.pipeline();

                if (runningPoints > highPoints) {
                    highPoints = runningPoints;
                    highPointsTieBreaker = tieBreaker;
                }

                pipeline.zadd(cacheKeys.entries, 'XX', this.pointFormatter.format(highPoints, highPointsTieBreaker), adjustment.userId.toString());

                if (adjustment.reset === 'Running')
                    runningPoints = 0;

                pipeline.zadd(cacheKeys.runningEntries, 'XX', this.pointFormatter.format(runningPoints, tieBreaker), adjustment.userId.toString());

                await pipeline.exec();

                const rank = await this.redis.cluster.zrevrank(cacheKeys.entries, adjustment.userId.toString());

                if (rank === null)
                    return;

                results.push({
                    userId: adjustment.userId,
                    rank: rank + 1,
                    points: highPoints,
                    tieBreaker: highPointsTieBreaker,
                    runningPoints,
                    runningTieBreaker: tieBreaker,
                    prevPoints: prevHighPoints,
                    prevRunningPoints
                });
            }, 10000);
        }

        Logger.info(`Leaderboard ${id}: Points adjusted`, results);

        return results;
    }

    public async addEntries(id: number, userIds: number[]): Promise<void> {
        const info = await this.getInfo(id);

        if (!info)
            return;

        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        const pipeline = this.redis.cluster.pipeline();

        for (const userId of userIds) {
            const tieBreaker = this.pointFormatter.getTieBreaker();
            const points = this.pointFormatter.format(0, tieBreaker);
            pipeline.zadd(cacheKeys.entries, 'NX', points, userId.toString());
            pipeline.zadd(cacheKeys.runningEntries, 'NX', points, userId.toString());
            pipeline.hset(cacheKeys.activeEntries, userId.toString(), new Date().toISOString());
        }

        await pipeline.exec();
    }

    public async getEntry(leaderboardId: number, userId: number): Promise<LeaderboardEntry | undefined> {
        const info = await this.getInfo(leaderboardId);

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        const cacheKeys = this.cacheKeyResolver.forLeaderboard(leaderboardId);
        const score = await this.redis.cluster.zscore(cacheKeys.entries, userId.toString());

        if (!score)
            return undefined;

        return this.mapper.mapEntry(leaderboardId, userId, score);
    }

    public async entryExists(leaderboardId: number, userId: number): Promise<boolean> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(leaderboardId);
        return await this.redis.cluster.zrank(cacheKeys.entries, userId.toString()) !== null;
    }

    public async removeEntries(leaderboardId: number, userIds: number[]): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(leaderboardId);
        const eventCacheKeys = await this.cacheKeyResolver.forEvents(leaderboardId);

        const pipeline = this.redis.cluster.pipeline()
            .zrem(cacheKeys.entries, ...userIds.map(userId => userId.toString()))
            .zrem(cacheKeys.runningEntries, ...userIds.map(userId => userId.toString()));

        for (const key of eventCacheKeys)
            pipeline.zrem(key, ...userIds.map(userId => userId.toString()));

        await pipeline.exec();
    }

    public async store(info: LeaderboardInfo): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(info.id);

        const ttl = await this.redis.cluster.ttl(cacheKeys.info);

        const pipeline = this.redis.cluster.pipeline()
            .set(cacheKeys.info, this.serialiser.serialise(info));

        if (ttl > -1)
            pipeline.expire(cacheKeys.info, ttl);

        await pipeline.exec();
    }

    public async remove(id: number): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        const eventCacheKeys = await this.cacheKeyResolver.forEvents(id);
        await this.removeFromIndex(id);
        await this.redis.cluster.del(cacheKeys.info, cacheKeys.entries, cacheKeys.runningEntries, cacheKeys.events, ...eventCacheKeys);
    }

    public async reset(id: number): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        const eventCacheKeys = await this.cacheKeyResolver.forEvents(id);
        await this.redis.cluster.del(cacheKeys.entries, cacheKeys.runningEntries, cacheKeys.events, ...eventCacheKeys);
    }

    public async exists(id: number): Promise<boolean> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        return await this.redis.cluster.exists(cacheKeys.info) === 1;
    }

    public async countEntries(id: number): Promise<number> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);
        return this.redis.cluster.zcard(cacheKeys.entries);
    }

    public async storeEntries(leaderboardId: number, entries: LeaderboardEntry[]): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(leaderboardId);
        await this.redis.cluster.pipeline()
            .del(cacheKeys.entries)
            .del(cacheKeys.runningEntries)
            .exec();

        const pipeline = this.redis.cluster.pipeline();

        for (const entry of entries) {
            pipeline.zadd(cacheKeys.entries, this.pointFormatter.format(entry.points, entry.tieBreaker), entry.userId.toString());
            pipeline.zadd(cacheKeys.runningEntries, this.pointFormatter.format(entry.runningPoints, entry.runningTieBreaker), entry.userId.toString());
            pipeline.hset(cacheKeys.activeEntries, entry.userId.toString(), new Date().toISOString());
        }

        await pipeline.exec();
    }

    public async expire(id: number, expireTime: Date | number): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(id);

        if (expireTime)
            if (typeof expireTime === 'number')
                expireTime = moment().utc().add(expireTime, 'minutes').unix();
            else
                expireTime = moment(expireTime).unix();

        const eventCacheKeys = await this.cacheKeyResolver.forEvents(id);

        const pipeline = this.redis.cluster.pipeline()
            .expireat(cacheKeys.info, expireTime)
            .expireat(cacheKeys.entries, expireTime)
            .expireat(cacheKeys.runningEntries, expireTime)
            .expireat(cacheKeys.events, expireTime)
            .expireat(cacheKeys.activeEntries, expireTime);

        for (const key of eventCacheKeys)
            pipeline.expireat(key, expireTime);

        await pipeline.exec();
    }

    public async addToIndex(info: LeaderboardInfo): Promise<void> {
        await this.redis.cluster.zadd(this.cacheKeyResolver.index, 'NX', info.createTime.getTime().toString(), info.id);
    }

    public async removeFromIndex(...ids: number[]): Promise<void> {
        await this.redis.cluster.zrem(this.cacheKeyResolver.index, ...ids);
    }

    public async updateActive(leaderboardId: number, entries: LeaderboardEntry[]): Promise<void> {
        const cacheKeys = this.cacheKeyResolver.forLeaderboard(leaderboardId);
        const pipeline = this.redis.cluster.pipeline();

        for (const entry of entries)
            pipeline.hset(cacheKeys.activeEntries, entry.userId.toString(), new Date().toISOString());

        await pipeline.exec();
    }
}