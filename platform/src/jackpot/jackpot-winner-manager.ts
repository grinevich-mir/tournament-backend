import { Singleton, Inject } from '../core/ioc';
import { NotFoundError } from '../core';
import Logger, { LogClass } from '../core/logging';
import { JackpotManager } from './jackpot-manager';
import { JackpotPayout } from './jackpot-payout';
import { JackpotWinner } from './jackpot-winner';
import { JackpotRepository } from './repositories';
import { JackpotWinnerMapper } from './jackpot-winner-mapper';
import { JackpotWinnerCache } from './cache';

@Singleton
@LogClass()
export class JackpotWinnerManager {
    constructor(
        @Inject private readonly repository: JackpotRepository,
        @Inject private readonly jackpotManager: JackpotManager,
        @Inject private readonly mapper: JackpotWinnerMapper,
        @Inject private readonly cache: JackpotWinnerCache) {
    }

    public async add(payout: JackpotPayout): Promise<void> {
        const jackpot = await this.jackpotManager.get(payout.jackpotId);

        if (!jackpot)
            throw new NotFoundError(`Jackpot ${payout.jackpotId} not found.`);

        const winner = this.mapper.map(payout, jackpot);
        await this.cache.add(winner);
    }

    public async getAll(count: number): Promise<JackpotWinner[]> {
        return this.cache.getAll(count);
    }

    public async refreshCache(count: number = 30): Promise<JackpotWinner[]> {
        if (count <= 0)
            count = 1;

        if (count > 30)
            count = 30;

        const winners: JackpotWinner[] = [];
        const payouts = await this.repository.getPayouts(count);

        for (const payout of payouts) {
            const jackpot = await this.jackpotManager.get(payout.jackpotId);

            if (!jackpot) {
                Logger.warn(`Unable to find jackpot ${payout.jackpotId}, skipping winner.`);
                continue;
            }

            const winner = this.mapper.map(payout, jackpot);
            winners.push(winner);
        }

        await this.cache.replaceAll(winners.reverse());
        return winners;
    }
}