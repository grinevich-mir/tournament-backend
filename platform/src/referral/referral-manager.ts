import { ReferralRewardType } from '.';
import { NotFoundError, PagedResult } from '../core';
import { PlatformEventDispatcher } from '../core/events';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { ReferralCreatedEvent, ReferralRewardCreatedEvent } from './events';
import { Referral } from './referral';
import { ReferralFilter } from './referral-filter';
import { NewReferralReward, ReferralReward } from './referral-reward';
import { ReferralRewardFilter } from './referral-reward-filter';
import { ReferralUserManager } from './referral-user-manager';
import { ReferralRepository } from './repositories';

@Singleton
@LogClass()
export class ReferralManager {
    constructor(
        @Inject private readonly repository: ReferralRepository,
        @Inject private readonly userManager: ReferralUserManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
    }

    public async getAll(filter?: ReferralFilter): Promise<PagedResult<Referral>> {
        return this.repository.getAll(filter);
    }

    public async get(id: number): Promise<Referral | undefined> {
        return this.repository.get(id);
    }

    public async getByReferee(refereeUserId: number): Promise<Referral | undefined> {
        return this.repository.getByReferee(refereeUserId);
    }

    public async getByReferrer(referrerUserId: number, filter?: ReferralFilter): Promise<PagedResult<Referral>> {
        return this.repository.getByReferrer(referrerUserId, filter);
    }

    public async add(referrerUserId: number, refereeUserId: number): Promise<Referral> {
        const referrer = await this.userManager.get(referrerUserId);

        if (!referrer)
            throw new NotFoundError('Could not find referrer.');

        const referral = await this.repository.add(referrerUserId, refereeUserId);
        referral.referrer.referralCount = await this.userManager.adjustReferralCount(referrerUserId, 1);
        await this.eventDispatcher.send(new ReferralCreatedEvent(referral));
        return referral;
    }

    public async adjustRevenue(id: number, amount: number): Promise<number> {
        return this.repository.adjustRevenue(id, amount);
    }

    public async getRewards(id: number, filter?: ReferralRewardFilter): Promise<PagedResult<ReferralReward>> {
        return this.repository.getRewards(id, filter);
    }

    public async addReward(reward: NewReferralReward): Promise<ReferralReward> {
        const referral = await this.get(reward.referralId);

        if (!referral)
            throw new NotFoundError('Referral not found.');

        const created = await this.repository.addReward(reward);
        await this.eventDispatcher.send(new ReferralRewardCreatedEvent(created));
        await this.repository.adjustRewardCount(reward.referralId, 1);
        await this.userManager.adjustRewardCount(reward.userId, 1);

        if (reward.type === ReferralRewardType.Diamonds) {
            await this.repository.adjustDiamondCount(reward.referralId, reward.amount);
            await this.userManager.adjustDiamondCount(reward.userId, reward.amount);
        }

        return created;
    }
}