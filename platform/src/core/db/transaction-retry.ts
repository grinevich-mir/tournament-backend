import { Connection, EntityManager, QueryFailedError } from 'typeorm';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import _ from 'lodash';
import Logger from '../logging';

type RunInTransaction<T> = (entityManager: EntityManager) => Promise<T>;

interface QueryFailedErrorX extends QueryFailedError {
    code: string;
    errno: number;
    sqlState: string;
    sqlMessage: string;
}

class RetryableTransactionRunner<T> {
    private maxAttempts = 5;
    private minDelay = 1;
    private maxDelay = 100;

    constructor(
        private readonly connection: Connection,
        private readonly runInTransaction: RunInTransaction<T>,
        private readonly isolationLevel?: IsolationLevel) {
    }

    public attempts(count: number): this {
        this.maxAttempts = count;
        return this;
    }

    public delay(min: number, max: number): this {
        this.minDelay = min;
        this.maxDelay = max;
        return this;
    }

    public async execute(): Promise<T> {
        for (let i = 0; i < this.maxAttempts; i++)
            try {
                return await this.run();
            } catch (err) {
                if (!this.canRetry(err) || i + 1 === this.maxAttempts)
                    throw err;

                Logger.warn(`Query failed (Attempt ${i + 1} of ${this.maxAttempts}):`, err);
                await this.sleep();
            }

        throw new Error(`This shouldn't happen.`);
    }

    private async run(): Promise<T> {
        if (this.isolationLevel)
            return this.connection.manager.transaction(this.isolationLevel, this.runInTransaction);

        return this.connection.manager.transaction(this.runInTransaction);
    }

    private canRetry(err: QueryFailedErrorX): boolean {
        if (err instanceof QueryFailedError && ['ER_LOCK_WAIT_TIMEOUT', 'ER_LOCK_DEADLOCK'].includes(err.code))
            return true;

        return false;
    }

    private async sleep(): Promise<void> {
        const delay = _.random(this.minDelay, this.maxDelay);
        return new Promise<void>(resolve => setTimeout(resolve, delay));
    }
}

export function transactionRetry<T>(connection: Connection, runInTransaction: RunInTransaction<T>): RetryableTransactionRunner<T>;
export function transactionRetry<T>(connection: Connection, isolationLevel: IsolationLevel, runInTransaction: RunInTransaction<T>): RetryableTransactionRunner<T>;
export function transactionRetry<T>(connection: Connection, isolationOrRunInTransaction: IsolationLevel | RunInTransaction<T>, runInTransactionParam?: RunInTransaction<T>): RetryableTransactionRunner<T> {
    const isolation = typeof isolationOrRunInTransaction === 'string' ? isolationOrRunInTransaction : undefined;
    const runInTransaction = typeof isolationOrRunInTransaction === 'function' ? isolationOrRunInTransaction : runInTransactionParam as RunInTransaction<T>;
    return new RetryableTransactionRunner(connection, runInTransaction, isolation);
}