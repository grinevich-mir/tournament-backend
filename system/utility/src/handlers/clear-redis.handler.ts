import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { Redis, lambdaHandler } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { LogClass } from '@tcom/platform/lib/core/logging';

interface ClearEvent {
    pattern?: string;
    show?: boolean;
}

@Singleton
@LogClass()
export class ClearRedisHandler {
    constructor(@Inject private readonly redis: Redis) {
    }

    public async execute(event: ClearEvent): Promise<void> {
        await this.redis.cluster.get('Test');
        const nodes = this.redis.cluster.nodes('master');
        const pattern = event.pattern || '*';

        for (const node of nodes) {
            const nodeId = nodes.indexOf(node) + 1;

            if (pattern === '*') {
                if (event.show) {
                    console.log(`Would have flushed node ${nodeId}`);
                    continue;
                }

                console.log(`Flushing DB on node ${nodeId}`);
                await node.flushdb();
                continue;
            }

            const keys = await node.keys(pattern);

            if (!keys || keys.length === 0) {
                console.log(`No keys matching pattern found on node ${nodeId}.`);
                continue;
            }

            if (event.show) {
                console.log(`Keys on node ${nodeId}:`);

                for (const key of keys)
                    console.log(key);
                continue;
            }

            console.log(`Clearing ${keys.length} key(s) on node ${nodeId}`);
            await this.clearKeys(keys);
        }
    }

    private async clearKeys(keys: string[]): Promise<void> {
        await Promise.all(keys.map(k => this.redis.cluster.del(k)));
    }
}

export const clearRedis = lambdaHandler((event: ClearEvent) => IocContainer.get(ClearRedisHandler).execute(event));