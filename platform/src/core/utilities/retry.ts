import _ from 'lodash';
import { TimeoutError } from '../errors';

export interface RetryOptions {
    shouldRetry: (err: Error, isTimeout?: boolean) => boolean;
    baseDelay: number;
    maxDelay: number;
    backOff: (retryCount: number, options: RetryOptions) => number;
    onRetry?: (err: Error, retryCount: number) => void | Promise<void>;
    onSuccess?: (retryCount: number, totalTime: number) => void | Promise<void>;
    timeout?: number;
    timeoutErrorMessage?: (timeout: number) => string;
}

function fullJitter(retryCount: number, options: RetryOptions): number {
    return _.random(0, Math.min(options.maxDelay, options.baseDelay * 2 ** retryCount));
}

const DEFAULT_OPTIONS: RetryOptions = {
    shouldRetry: () => true,
    baseDelay: 2, // 2ms
    maxDelay: 100, // 100ms,
    backOff: fullJitter
};

async function delay(ms: number): Promise<void> {
    return new Promise((resolve: () => void) => setTimeout(resolve, ms));
}

async function timeout(ms: number, opts: RetryOptions): Promise<void> {
    return new Promise((_resolve, reject) => {
        const timer = setTimeout(() => {
            clearTimeout(timer);
            const errMsg = opts.timeoutErrorMessage ? opts.timeoutErrorMessage(opts.timeout || 0) : `Execution timed out after ${opts.timeout || 0} ms`;
            reject(new TimeoutError(errMsg));
        }, ms);
    });
}

export async function retry<T = void>(func: () => Promise<T>, count: number, options?: Partial<RetryOptions>): Promise<T> {
    const opts: RetryOptions = {
        ...DEFAULT_OPTIONS,
        ...options
    };

    let retryCount = 0;
    const startTime = Date.now();

    async function run(): Promise<T> {
        try {
            let result: T;

            if (opts.timeout) {
                const promise = func();
                const to = timeout(opts.timeout, opts) as unknown as Promise<T>;
                result = await Promise.race([
                    promise,
                    to
                ]);
            } else
                result = await func();

            if (opts.onSuccess) {
                const duration = Date.now() - startTime;
                await opts.onSuccess(retryCount, duration);
            }

            return result;
        } catch (err) {
            if (retryCount >= count || !opts.shouldRetry(err, err instanceof TimeoutError))
                throw err;

            retryCount++;
            const sleep = opts.backOff(retryCount, opts);

            if (opts.onRetry)
               await opts.onRetry(err, retryCount);

            await delay(sleep);
            return run();
        }
    }

    return run();
}