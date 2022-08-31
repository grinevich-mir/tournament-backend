import { Singleton, Inject } from '../core/ioc';
import { WebsocketConnection } from './websocket-connection';
import { CacheKeyGenerator } from '../core/cache';
import { Redis, JsonSerialiser } from '../core';
import moment from 'moment';
import _ from 'lodash';

@Singleton
export class WebsocketManager {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('WEBSOCKETS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async get(id: string): Promise<WebsocketConnection | undefined> {
        const connectionCacheKey = this.cacheKeyGenerator.generate('Connection', id);
        const rawItem = await this.redis.cluster.get(connectionCacheKey);

        if (!rawItem)
            return undefined;

        return this.serialiser.deserialise(rawItem);
    }

    public async getMany(ids: string[]): Promise<WebsocketConnection[]> {
        if (!ids || ids.length === 0)
            return [];

        const connections = [];

        for (const id of ids) {
            const connection = await this.get(id);
            if (!connection)
                continue;

            connections.push(connection);
        }

        return connections;
    }

    public async getByUserId(userId: number): Promise<WebsocketConnection[]> {
        const cacheKey = this.cacheKeyGenerator.generate('UserId-ConnectionId', userId);
        const connectionIds = await this.redis.cluster.smembers(cacheKey) as string[];
        return this.getMany(connectionIds);
    }

    public async getByTopics(...topics: string[]): Promise<WebsocketConnection[]> {
        const connectionIds: string[] = [];

        for (const topic of topics) {
            const cacheKey = this.cacheKeyGenerator.generate('Topics', topic);
            const topicIds = await this.redis.cluster.smembers(cacheKey) as string[];

            for (const id of topicIds)
                if (!connectionIds.includes(id))
                    connectionIds.push(id);
        }

        return this.getMany(connectionIds);
    }

    public async add(id: string, skinId: string, region: string, apiId: string): Promise<WebsocketConnection> {
        const connection: WebsocketConnection = {
            id,
            skinId,
            topics: [],
            region,
            apiId
        };

        await this.store(connection);
        return connection;
    }

    public async remove(id: string): Promise<void> {
        const connection = await this.get(id);

        if (!connection)
            return;

        if (connection.topics.length > 0)
            for (const topic of connection.topics) {
                const topicCacheKey = this.cacheKeyGenerator.generate('Topics', topic);
                await this.redis.cluster.srem(topicCacheKey, id);
            }

        if (connection.userId) {
            const userIdCacheKey = this.cacheKeyGenerator.generate('UserId-ConnectionId', connection.userId);
            await this.redis.cluster.srem(userIdCacheKey, connection.id);
        }

        const connectionCacheKey = this.cacheKeyGenerator.generate('Connection', id);
        await this.redis.cluster.del(connectionCacheKey);
    }

    public async setUserId(id: string, userId: number): Promise<void> {
        const connection = await this.get(id);

        if (!connection)
            return;

        connection.userId = userId;
        const userIdCacheKey = this.cacheKeyGenerator.generate('UserId-ConnectionId', connection.userId);
        await this.redis.cluster.sadd(userIdCacheKey, connection.id);
        await this.store(connection);
    }

    public async unsetUserId(id: string): Promise<void> {
        const connection = await this.get(id);

        if (!connection)
            return;

        delete connection.userId;
        await this.store(connection);
        const userIdCacheKey = this.cacheKeyGenerator.generate('UserId-ConnectionId', connection.userId);
        await this.redis.cluster.srem(userIdCacheKey, id);
    }

    public async subscribe(id: string, topic: string): Promise<void> {
        const connection = await this.get(id);

        if (!connection)
            return;

        if (connection.topics.includes(topic))
            return;

        connection.topics.push(topic);
        await this.store(connection);

        const cacheKey = this.cacheKeyGenerator.generate('Topics', topic);
        const expiration = this.getExpiration();
        await this.redis.cluster.pipeline().sadd(cacheKey, id).expireat(cacheKey, expiration).exec();
    }

    public async unsubscribe(id: string, topic: string): Promise<void> {
        const connection = await this.get(id);

        if (!connection)
            return;

        const topicIndex = connection.topics.indexOf(topic);

        if (topicIndex === -1)
            return;

        connection.topics.splice(topicIndex, 1);
        await this.store(connection);

        const cacheKey = this.cacheKeyGenerator.generate('Topics', topic);
        const expiration = this.getExpiration();
        await this.redis.cluster.pipeline().srem(cacheKey, id).expireat(cacheKey, expiration).exec();
    }

    public async extend(id: string): Promise<void> {
        const connection = await this.get(id);

        if (!connection)
            return;

        const expiration = this.getExpiration();
        const cacheKey = this.cacheKeyGenerator.generate('Connection', id);
        await this.redis.cluster.expireat(cacheKey, expiration);

        const userIdCacheKey = this.cacheKeyGenerator.generate('UserId-ConnectionId', connection.userId);
        await this.redis.cluster.expireat(userIdCacheKey, expiration);
    }

    private async store(connection: WebsocketConnection): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate('Connection', connection.id);
        const expiration = this.getExpiration();
        const data = this.serialiser.serialise(connection);
        await this.redis.cluster.pipeline().set(cacheKey, data).expireat(cacheKey, expiration).exec();

        if (!connection.userId)
            return;

        const userIdCacheKey = this.cacheKeyGenerator.generate('UserId-ConnectionId', connection.userId);
        await this.redis.cluster.expireat(userIdCacheKey, expiration);
    }

    private getExpiration(): number {
        return moment().add(7, 'days').unix();
    }
}