import { Redis as IORedis, Cluster, ClusterNode, Pipeline } from 'ioredis';
import Redlock from 'redlock';
import { Singleton } from './ioc';
import * as env from 'env-var';
import asCallback from 'standard-as-callback';
import { retry } from './utilities';
import Logger from './logging';
import COMMANDS from 'ioredis-commands';

const LOCK_PREFIX = 'LOCKS';

const TIMEOUT_CONFIG: { [key: string]: number } = {
    global: 3000
};

@Singleton
export class Redis {
    private static maxRetries = 10;

    private static cluster?: Cluster;
    private static lock?: Redlock;

    public static disconnect(): void {
        if (!this.cluster)
            return;

        try {
            this.cluster.disconnect();
        } catch {}
        this.cluster = undefined;
        Logger.info('Redis cluster disconnected.');
    }

    public get cluster(): Cluster {
        if (!Redis.cluster) {
            const nodes = this.getClusterNodes();
            const instance = new Cluster(nodes, {
                slotsRefreshTimeout: 2000,
                scaleReads: 'slave',
                maxRedirections: 32,
                redisOptions: {
                    reconnectOnError: (err: Error) => err.message.includes('READONLY')
                }
            });

            if (Redis.maxRetries > 0)
                this.patchCluster(instance);

            this.setupLogging(instance);

            Redis.cluster = instance;
        }

        return Redis.cluster;
    }

    public async lock<T>(key: string, handler: (lock: Redlock.Lock) => Promise<T>, ttl: number): Promise<T> {
        if (!Redis.lock)
            Redis.lock = new Redlock([this.cluster], {
                retryCount: 100
            });

        const lock = await Redis.lock.acquire(`${LOCK_PREFIX}:${key}`, ttl);
        try {
            return await handler(lock);
        } finally {
            await lock.unlock();
        }
    }

    public async unlock(key: string): Promise<void> {
        await this.cluster.del(`${LOCK_PREFIX}:${key}`);
    }

    public getClusterNodes(): ClusterNode[] {
        const endpoint = env.get('REDIS_CLUSTER_ENDPOINT').required().asString();
        const port = env.get('REDIS_CLUSTER_PORT', '6379').asIntPositive();
        return [{
            port,
            host: endpoint
        }];
    }

    private patchCluster(cluster: Cluster & any): void {
        Logger.debug('Patching Redis cluster instance with retry mechanism...');
        let commandPatchCount = 0;
        for (const command of Object.keys(COMMANDS)) {
            const ms = TIMEOUT_CONFIG[command] || TIMEOUT_CONFIG.global;

            if (!ms)
                continue;

            if (['multi', 'pipeline'].includes(command))
                continue;

            this.patchFunction(cluster, command, ms);
            commandPatchCount++;
        }

        Logger.debug(`${commandPatchCount} Redis command(s) patched.`);

        this.patchPipelineFunc(cluster, 'pipeline');
        this.patchPipelineFunc(cluster, 'multi');
    }

    private patchPipelineFunc(cluster: Cluster & any, command: 'pipeline' | 'multi'): void {
        Logger.debug(`Patching '${command}' command...'`);
        const origCommand = cluster[`_${command}`] || cluster[command];

        if (!origCommand || typeof origCommand !== 'function')
            return;

        cluster[`_${command}`] = origCommand.bind(cluster);
        cluster[command] = () => {
            const args = [].slice.call(arguments);
            const pipeline = origCommand.apply(cluster, args);
            this.patchPipeline(pipeline);
            return pipeline;
        };
    }

    private patchPipeline(pipeline: Pipeline & any): void {
        const ms = TIMEOUT_CONFIG.exec || TIMEOUT_CONFIG.global;

        if (!ms)
            return;

        this.patchFunction(pipeline, 'exec', ms);
        Logger.debug('Redis Pipeline Patched.');
    }

    private patchFunction(target: any, command: string, ms: number): void {
        const origCommand = target[`_${command}`] || target[command];

        if (!origCommand || typeof origCommand !== 'function')
            return;

        target[`_${command}`] = origCommand.bind(target);
        // tslint:disable-next-line: only-arrow-functions
        target[command] = function() {
            const args = [].slice.call(arguments);
            let cb = null;
            if (typeof args[args.length - 1] === 'function')
                cb = args.pop();

            const promise = retry(() => origCommand.apply(target, args), Redis.maxRetries, {
                timeout: ms,
                shouldRetry: (_err, isTimeout) => isTimeout === true,
                onRetry: (err, retryCount) => Logger.warn(`Redis '${command}' command failed, retry ${retryCount}/${Redis.maxRetries}`, err),
                onSuccess: (retryCount, totalTime) => {
                    if (retryCount === 0)
                        return;

                    Logger.error(`Redis '${command}' command succeeded after ${retryCount} ${retryCount === 1 ? 'retry' : 'retries'} and ${totalTime} ms.`);
                }
            });

            if (typeof cb === 'function')
                return asCallback(promise, cb);

            return promise;
        };
    }

    private setupLogging(cluster: Cluster): void {
        cluster.on('connecting', () => Logger.info('Redis: Connecting...'));
        cluster.on('connect', () => Logger.info('Redis: Connected'));
        cluster.on('wait', () => Logger.info('Redis: Waiting...'));
        cluster.on('ready', () => Logger.info('Redis: Ready'));
        cluster.on('error', (err) => Logger.error('Redis:', err));
        cluster.on('+node', (redis: IORedis) => Logger.info(`Redis: Connecting to Node ${redis.options.host}...`));
        cluster.on('-node', (redis: IORedis) => Logger.info(`Redis: Disconnected from Node ${redis.options.host}`));
        cluster.on('node error', (err, key) => Logger.warn(`Redis: Node ${key}`, err));
        // cluster.on('refresh', (err) => Logger.info('Redis: Slots refreshed'));
        cluster.on('disconnecting', () => Logger.info('Redis: Disconnecting...'));
        cluster.on('close', (err) => Logger.info('Redis: Closed'));
        cluster.on('reconnecting', (err) => Logger.info('Redis: Reconnecting...'));
        cluster.on('end', (err) => Logger.info('Redis: Ended'));
        cluster.on('select', (db) => Logger.info(`Redis: Database Change to ${db}`));
    }
}