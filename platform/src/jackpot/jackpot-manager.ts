import _ from 'lodash';
import { Ledger, PlatformWallets, RequesterType, TransactionPurpose, UserWalletAccounts } from '../banking';
import { roundMoney } from '../banking/utilities';
import { ForbiddenError, NotFoundError } from '../core';
import { PlatformEventDispatcher } from '../core/events';
import { Inject, Singleton } from '../core/ioc';
import Logger, { LogClass } from '../core/logging';
import { JackpotCache } from './cache';
import { JackpotPaidOutEvent } from './events';
import { FixedJackpot, Jackpot } from './jackpot';
import { JackpotAdjustmentPurpose } from './jackpot-adjustment-purpose';
import { JackpotFilter } from './jackpot-filter';
import { JackpotPayout } from './jackpot-payout';
import { JackpotType } from './jackpot-type';
import { JackpotUpdate } from './jackpot-update';
import { NewJackpot } from './new-jackpot';
import { JackpotRepository } from './repositories';

@Singleton
@LogClass()
export class JackpotManager {
    constructor(
        @Inject private readonly repository: JackpotRepository,
        @Inject private readonly cache: JackpotCache,
        @Inject private readonly ledger: Ledger,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
        }

    public async get(id: number): Promise<Jackpot | undefined> {
        const cached = await this.cache.get(id);

        if (cached)
            return cached;

        const jackpot = await this.repository.get(id);

        if (!jackpot)
            return undefined;

        await this.cache.store(jackpot);
        return jackpot;
    }

    public async getAll(filter?: JackpotFilter): Promise<Jackpot[]> {
        const cached = await this.cache.getAll();

        if (cached.length > 0)
            return this.filterJackpots(cached, filter);

        const jackpots = await this.repository.getAll();

        if (jackpots.length === 0)
            return [];

        await this.cache.store(...jackpots);
        return _.sortBy(this.filterJackpots(jackpots, filter), j => j.id);
    }

    public async getMany(...ids: number[]): Promise<Jackpot[]> {
        const cached = await this.cache.getMany(...ids);

        const uncachedIds = ids.filter(i => !cached.find(c => c.id === i));

        if (uncachedIds.length === 0)
            return cached;

        const jackpots = await this.repository.getMany(...uncachedIds);

        if (jackpots.length === 0)
            return cached;

        await this.cache.store(...jackpots);
        return _.sortBy(cached.concat(jackpots), j => j.id);
    }

    public async add(jackpot: NewJackpot): Promise<Jackpot> {
        const created = await this.repository.add(jackpot);

        switch (jackpot.type) {
            case JackpotType.Fixed:
                if (!jackpot.seed)
                    break;

                const fixedJackpot = created as FixedJackpot;
                const balance = await this.repository.addAdjustment(created.id, jackpot.seed, JackpotAdjustmentPurpose.Seed, 'System');
                fixedJackpot.balance = balance;
                break;
        }

        await this.cache.store(created);
        return created;
    }

    public async update(id: number, update: JackpotUpdate): Promise<Jackpot> {
        return this.cache.lock(id, async () => {
            let jackpot = await this.get(id);

            if (!jackpot)
                throw new NotFoundError('Jackpot not found.');

            await this.repository.update(id, update);
            jackpot = await this.repository.get(id) as Jackpot;
            await this.cache.store(jackpot);
            return jackpot;
        });
    }

    public async setEnabled(id: number, enabled: boolean): Promise<void> {
        await this.cache.lock(id, async () => {
            const jackpot = await this.get(id);

            if (!jackpot)
                throw new NotFoundError('Jackpot not found.');

            if (jackpot.enabled === enabled)
                return;

            await this.repository.setEnabled(id, enabled);
            jackpot.enabled = enabled;
            jackpot.updateTime = new Date();
            await this.cache.store(jackpot);
        });
    }

    public async adjust(id: number, amount: number, purpose: JackpotAdjustmentPurpose, source: string): Promise<number> {
        return this.cache.lock(id, async () => {
            const jackpot = await this.get(id);

            if (!jackpot)
                throw new NotFoundError('Jackpot not found.');

            if (jackpot.type === JackpotType.Tangible)
                throw new ForbiddenError('Tangible jackpots cannot be adjusted.');

            amount = roundMoney(amount, 'USD');

            if (amount === 0)
                return jackpot.balance;

            if (jackpot.type === JackpotType.Progressive && jackpot.maxBalance && amount > 0) {
                if (jackpot.balance >= jackpot.maxBalance)
                    return jackpot.balance;

                const diff = jackpot.maxBalance - jackpot.balance;
                amount = Math.min(diff, amount);
            }

            if (jackpot.balance + amount < 0)
                amount = jackpot.balance;

            const balance = await this.repository.addAdjustment(id, amount, purpose, source);
            jackpot.balance = balance;
            jackpot.balanceUpdateTime = new Date();
            await this.cache.store(jackpot);
            return balance;
        });
    }

    public async reset(id: number, source: string): Promise<number> {
        return this.cache.lock(id, async () => {
            const jackpot = await this.get(id);

            if (!jackpot)
                throw new NotFoundError('Jackpot not found.');

            if (jackpot.type === JackpotType.Tangible)
                throw new ForbiddenError('Tangible jackpots cannot be reset.');

            let balance = await this.repository.addAdjustment(id, -jackpot.balance, JackpotAdjustmentPurpose.Reset, source);

            if (jackpot.seed > 0)
                balance = await this.repository.addAdjustment(id, jackpot.seed, JackpotAdjustmentPurpose.Seed, source);

            jackpot.balance = balance;
            jackpot.balanceUpdateTime = new Date();
            jackpot.updateTime = new Date();

            await this.cache.store(jackpot);
            return balance;
        });
    }

    public async payout(id: number, userIds: number[], source: string): Promise<JackpotPayout[]> {
        return this.cache.lock(id, async () => {
            const jackpot = await this.get(id);

            if (!jackpot)
                throw new NotFoundError('Jackpot not found.');

            if (!jackpot.enabled) {
                Logger.warn(`Jackpot ${id} is disabled, payout ignored.`);
                return [];
            }

            if (jackpot.type === JackpotType.Tangible) // TODO: Notify of tangible prize win?
                return [];

            if (jackpot.balance === 0) {
                Logger.warn('Jackpot balance is zero and cannot be paid out.');
                return [];
            }

            let amountPerUser = jackpot.balance;

            if (jackpot.splitPayout)
                amountPerUser = roundMoney(jackpot.balance / userIds.length, 'USD');

            const payouts: JackpotPayout[] = [];

            for (const userId of userIds) {
                const payout = await this.payoutUser(jackpot, userId, amountPerUser);
                payouts.push(payout);
            }

            let balance = await this.repository.addAdjustment(id, -jackpot.balance, JackpotAdjustmentPurpose.Payout, source);

            const lastPayoutTime = new Date();
            const totalPayout = jackpot.splitPayout ? amountPerUser * userIds.length : jackpot.balance * userIds.length;
            await this.repository.setLastPayout(id, lastPayoutTime, totalPayout);

            if (jackpot.seed > 0)
                balance = await this.repository.addAdjustment(id, jackpot.seed, JackpotAdjustmentPurpose.Seed, source);

            jackpot.balance = balance;
            jackpot.balanceUpdateTime = lastPayoutTime;
            jackpot.updateTime = lastPayoutTime;
            jackpot.lastPayoutTime = lastPayoutTime;
            jackpot.lastPayoutAmount = totalPayout;

            await this.cache.store(jackpot);

            await this.eventDispatcher.send(new JackpotPaidOutEvent(id, totalPayout, payouts, source));

            return payouts;
        });
    }

    private async payoutUser(jackpot: Jackpot, userId: number, amount: number): Promise<JackpotPayout> {
        const walletEntry = await this.ledger.transfer(amount, 'USD')
            .purpose(TransactionPurpose.JackpotPayout)
            .requestedBy(RequesterType.System, `Jackpot:${jackpot.id}`)
            .memo(`${jackpot.name} Jackpot Payout`)
            .fromPlatform(PlatformWallets.Prize)
            .toUser(userId, UserWalletAccounts.Withdrawable)
            .commit();

        return this.repository.addPayout(jackpot.id, userId, amount, walletEntry.id);
    }

    private filterJackpots(source: Jackpot[], filter?: JackpotFilter): Jackpot[] {
        if (filter) {
            if (filter.type)
                source = source.filter(j => j.type === filter.type);

            if (filter.enabled !== undefined)
                source = source.filter(j => j.enabled === filter.enabled);
        }

        return source;
    }
}