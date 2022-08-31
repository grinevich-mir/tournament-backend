import { LeaderboardManager } from './leaderboard-manager';
import { Inject, Singleton } from '../core/ioc';
import { LeaderboardProgress, LeaderboardMilestone } from './leaderboard-progress';
import { LeaderboardInfo } from './leaderboard-info';
import { NotFoundError, Redis } from '../core';
import { CacheKeyResolver } from './utilities';
import Logger, { LogClass } from '../core/logging';
import { Websocket } from '../websocket';

export interface LeaderboardProgressProcessRequest {
    increments: string[];
    resets: string[];
}

export interface LeaderboardProgressProcessingResult {
    [event: string]: number;
}

@Singleton
@LogClass()
export class LeaderboardProgressManager {
    constructor(
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly cacheKeyResolver: CacheKeyResolver,
        @Inject private readonly redis: Redis,
        @Inject private readonly websocket: Websocket) {
    }

    public async get(id: number, userId: number, eventName?: string): Promise<LeaderboardProgress[]>;
    public async get(leaderboard: LeaderboardInfo, userId: number, eventName?: string): Promise<LeaderboardProgress[]>;
    public async get(idOrLeaderboard: number | LeaderboardInfo, userId: number, eventName?: string): Promise<LeaderboardProgress[]> {
        const info = typeof idOrLeaderboard === 'number' ? await this.leaderboardManager.getInfo(idOrLeaderboard) : idOrLeaderboard;

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        if (!info.pointConfig)
            return [];

        const result: LeaderboardProgress[] = [];

        for (const event of Object.keys(info.pointConfig)) {
            const config = info.pointConfig[event];
            const resets = config.resetCounts || [];

            if (eventName && (eventName !== event || resets.includes(eventName)))
                continue;

            const rules = config.rules;

            const cacheKey = this.cacheKeyResolver.forEvent(info.id, event);
            const rawCount = await this.redis.cluster.zscore(cacheKey, userId.toString());

            const count = rawCount ? Number(rawCount) : 0;

            const milestones: LeaderboardMilestone[] = [];

            for (const rule of rules) {
                if (!rule.count)
                    continue;

                milestones.push({
                    description: rule.description,
                    target: rule.count
                });
            }

            if (milestones.length === 0)
                continue;

            result.push({
                event,
                count,
                milestones
            });
        }

        if (result.length === 0)
            return [];

        return result;
    }

    public async incrementCount(id: number, userId: number, eventName: string, resetCounts?: string[]): Promise<number>;
    public async incrementCount(leaderboard: LeaderboardInfo, userId: number, eventName: string, resetCounts?: string[]): Promise<number>;
    public async incrementCount(idOrLeaderboard: number | LeaderboardInfo, userId: number, eventName: string, resetCounts?: string[]): Promise<number> {
        const info = typeof idOrLeaderboard === 'number' ? await this.leaderboardManager.getInfo(idOrLeaderboard) : idOrLeaderboard;

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        Logger.debug(`Incrementing ${eventName} event count for user ${userId}...`);

        const cacheKey = this.cacheKeyResolver.forEvent(info.id, eventName);
        const rawCount = await this.redis.cluster.zincrby(cacheKey, 1, userId.toString());
        const count = Number(rawCount);

        if (resetCounts && resetCounts.length > 0)
            await this.resetCount(info, userId, ...resetCounts);

        await this.sendUpdate(info, userId);
        return count;
    }

    public async reset(id: number, userId: number): Promise<void>;
    public async reset(leaderboard: LeaderboardInfo, userId: number): Promise<void>;
    public async reset(idOrLeaderboard: number | LeaderboardInfo, userId: number): Promise<void> {
        const info = typeof idOrLeaderboard === 'number' ? await this.leaderboardManager.getInfo(idOrLeaderboard) : idOrLeaderboard;

        if (!info)
            throw new NotFoundError('Leaderboard does not exist.');

        const eventCacheKeys = await this.cacheKeyResolver.forEvents(info.id);

        if (eventCacheKeys.length === 0)
            return;

        Logger.debug(`Resetting all event counts for user ${userId}`);

        const pipeline = this.redis.cluster.pipeline();

        for (const cacheKey of eventCacheKeys)
            pipeline.zadd(cacheKey, '0', userId.toString());

        await pipeline.exec();
        await this.sendUpdate(info, userId);
    }

    private async resetCount(info: LeaderboardInfo, userId: number, ...eventNames: string[]): Promise<void> {
        if (eventNames.length === 0)
            return;

        Logger.debug(`Resetting event counts for user ${userId}`, eventNames);

        const pipeline = this.redis.cluster.pipeline();

        for (const name of eventNames) {
            const cacheKey = this.cacheKeyResolver.forEvent(info.id, name);
            pipeline.zadd(cacheKey, '0', userId.toString());
        }

        await pipeline.exec();
    }

    private async sendUpdate(info: LeaderboardInfo, userId: number, eventName?: string): Promise<void> {
        const progress = await this.get(info, userId, eventName);

        if (progress.length === 0)
            return;

        await this.websocket.send({
            type: 'User',
            userId
        }, 'Leaderboard:Progress', {
            leaderboardId: info.id,
            progress
        });
    }
}