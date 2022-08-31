import { Tournament } from '../tournament';
import { CacheKeyGenerator } from '../../core/cache';
import { CACHE_PREFIX } from './constants';
import { Redis } from '../../core/redis';
import moment from 'moment';
import { TournamentState } from '../tournament-state';
import { JsonSerialiser } from '../../core';
import { LogClass } from '../../core/logging';
import _ from 'lodash';
import { Inject, Singleton } from '../../core/ioc';

@Singleton
@LogClass()
export class TournamentCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator(CACHE_PREFIX);

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async getAll(): Promise<Tournament[]> {
        const ids = await this.getIds();
        const removed: number[] = [];
        const items: Tournament[] = [];

        for (const id of ids) {
            const item = await this.get(id);

            if (!item) {
                removed.push(id);
                continue;
            }

            items.push(item);
        }

        if (removed.length > 0)
            await this.removeFromIndex(...removed);

        return _.sortBy(items, t => t.startTime);
    }

    public async get(id: number): Promise<Tournament | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate(id);
        const rawInfo = await this.redis.cluster.get(cacheKey);

        if (!rawInfo)
            return undefined;

        return this.serialiser.deserialise<Tournament>(rawInfo);
    }

    public async store(tournament: Tournament, expireTime?: Date): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate(tournament.id);

        const pipeline = this.redis.cluster.pipeline()
                .set(cacheKey, this.serialiser.serialise(tournament));

        if (!expireTime)
            expireTime = this.getExpireTime(tournament);

        pipeline.expireat(cacheKey, moment(expireTime).unix());

        await pipeline.exec();

        if (!tournament.enabled || tournament.state > TournamentState.Running)
            await this.removeFromIndex(tournament.id);
        else
            await this.addToIndex(tournament);
    }

    public async lock<T>(id: number, handler: () => Promise<T>): Promise<T> {
        const key = this.cacheKeyGenerator.generate(id);
        return this.redis.lock(key, handler, 30000);
    }

    public async remove(id: number): Promise<void> {
        await this.lock(id, async () => {
            await this.removeFromIndex(id);
            const cacheKey = this.cacheKeyGenerator.generate(id);
            await this.redis.cluster.del(cacheKey);
        });
    }

    public async exists(id: number): Promise<boolean> {
        const cacheKey = this.cacheKeyGenerator.generate(id);
        return await this.redis.cluster.exists(cacheKey) === 1;
    }

    public async clear(): Promise<void> {
        const currentIds = await this.getIds();

        if (currentIds.length === 0)
            return;

        await this.clearIndex();

        for (const id of currentIds) {
            const cacheKey = this.cacheKeyGenerator.generate(id);
            await this.redis.cluster.del(cacheKey);
            await this.redis.unlock(cacheKey);
        }
    }

    private async addToIndex(tournament: Tournament): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate('Active');
        await this.redis.cluster.zadd(cacheKey, 'NX', tournament.startTime.getTime().toString(), tournament.id.toString());
    }

    private async removeFromIndex(...ids: number[]): Promise<void> {
        if (ids.length === 0)
            return;

        const cacheKey = this.cacheKeyGenerator.generate('Active');
        await this.redis.cluster.zrem(cacheKey, ...ids);
    }

    private async getIds(): Promise<number[]> {
        const cacheKey = this.cacheKeyGenerator.generate('Active');
        const rawIds: string[] = await this.redis.cluster.zrangebyscore(cacheKey, '-inf', '+inf');

        if (!rawIds || rawIds.length === 0)
            return [];

        return rawIds.map(i => Number(i));
    }

    private async clearIndex(): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate('Active');
        await this.redis.cluster.del(cacheKey);
    }

    public getExpireTime(tournament: Tournament): Date {
        let expireTime = moment(tournament.startTime).add(90, 'days');

        if (tournament.state >= TournamentState.Ended)
            expireTime = moment.utc().add(3, 'days');
        else if (tournament.endTime)
            expireTime = moment(tournament.endTime).add(3, 'days');

        return expireTime.toDate();
    }
}