import { Singleton, Inject, IocContainer } from '../core/ioc';
import { Redis, JsonSerialiser } from '../core';
import * as env from 'env-var';
import Logger, { LogClass } from '../core/logging';
import util from 'util';
import { Controller } from './controller';

const PROCESSING = 'PROCESSING';
const COMPLETE = 'COMPLETE';

export interface IdempotencyOptions {
    processingExpiry?: number;
    expiry?: number;
}

export interface IdempotencyDecoratorOptions extends IdempotencyOptions {
    headerName?: string;
}

const DEFAULTS: Required<IdempotencyDecoratorOptions> = {
    headerName: 'x-idempotency-key',
    processingExpiry: 30, // 30 Seconds
    expiry: 300 // 5 Minutes
};

@Singleton
@LogClass()
export class IdempotencyCache {
    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async get<T = void>(idempotencyId: string, handler: () => Promise<T | void>, options?: IdempotencyOptions): Promise<T | void> {
        const opts: Required<IdempotencyOptions> = {
            ...DEFAULTS,
            ...options
        };

        const key = this.getCacheKey(idempotencyId);
        const cachedItemRaw = await this.redis.cluster.get(key);

        if (cachedItemRaw) {
            if (cachedItemRaw === PROCESSING)
                throw new Error(`A request with Idempotency ID ${idempotencyId} is still being processed.`);

            if (cachedItemRaw === COMPLETE)
                return;

            return this.serialiser.deserialise<T>(cachedItemRaw);
        }

        await this.redis.cluster.set(key, PROCESSING, 'EX', opts.processingExpiry);

        try {
            const result = await handler();
            const data = result ? this.serialiser.serialise(result) : COMPLETE;
            await this.redis.cluster.set(key, data, 'EX', opts.expiry);
            return result;
        } catch (err) {
            await this.redis.cluster.del(key);
            throw err;
        }
    }

    private getCacheKey(idempotencyId: string): string {
        const service = env.get('SERVICE').required().asString();
        return `CACHE:IDEMP:${service}:${idempotencyId}`;
    }
}

export function Idempotent(options?: Partial<IdempotencyDecoratorOptions>): (target: any, methodName: string, descriptor: PropertyDescriptor) => void {
    return (target: any, methodName: string, descriptor: PropertyDescriptor) => {
        if (descriptor === undefined)
            descriptor = Object.getOwnPropertyDescriptor(target, methodName) as PropertyDescriptor;

        if (descriptor.get || descriptor.set)
            return descriptor;

        const originalMethod = descriptor.value;

        if (originalMethod.__idempotencyPatchApplied === true)
            return descriptor;

        if (!util.types.isAsyncFunction(originalMethod))
            throw new Error(`Method '${methodName}' must async.`);

        if (!(target instanceof Controller))
            throw new Error('Idempotent decorator must be a applied to an API controller.');

        const opts: Required<IdempotencyDecoratorOptions> = {
            ...DEFAULTS,
            ...options
        };

        const patchedMethod = async function (this: Controller, ...args: any[]) {
            const idHeader = this.request.header(opts.headerName);

            if (!idHeader) {
                Logger.warn('No idempotency key provided.');
                return originalMethod.apply(this, args);
            }

            const cache = IocContainer.get(IdempotencyCache);
            const key = `${methodName}-${idHeader}`;
            return cache.get(key, () => originalMethod.apply(this, args), options);
        };

        descriptor.value = patchedMethod;
        patchedMethod.__idempotencyPatchApplied = true;
        return descriptor;
    };
}