import { Singleton, Inject } from '../core/ioc';
import Logger, { LogClass } from '../core/logging';
import { Payment, PaymentType } from '../payment';
import { ReferralManager } from './referral-manager';
import { Ledger, TransactionPurpose, RequesterType, PlatformWallets, UserWalletAccounts } from '../banking';
import { ReferralCommissionManager } from './referral-commission-manager';
import _ from 'lodash';
import { Referral } from '../referral';
import { roundMoney } from '../banking/utilities';
import { ReferralCommissionType } from './referral-commission-type';
import { ReferralCommissionRate } from './referral-commission-rate';
import { ReferralRewardType } from './referral-reward-type';
import { ReferralUserManager } from './referral-user-manager';
import { ReferralEventType } from './referral-event-type';

@Singleton
@LogClass()
export class ReferralCommissionProcessor {
    constructor(
        @Inject private readonly referralManager: ReferralManager,
        @Inject private readonly userManager: ReferralUserManager,
        @Inject private readonly commissionManager: ReferralCommissionManager,
        @Inject private readonly ledger: Ledger) {
    }

    public async process(referral: Referral, payment: Payment): Promise<void> {
        if (!payment)
            Logger.error('Payment was not available in action context input.');

        const rates = await this.commissionManager.getRates({
            enabled: true
        });

        if (rates.length === 0)
            return;

        const maxDepth = _.maxBy(rates, r => r.level)?.level;

        if (!maxDepth)
            return;

        const referrals = await this.getReferralPath(referral, maxDepth);

        for (let i = 0; i < referrals.length; i++) {
            const currReferral = referrals[i];

            if (!currReferral.referee.active)
                continue;

            const level = i + 1;
            const rate = rates.find(r => r.groupId === currReferral.referee.groupId && r.level === level);

            if (!rate || !rate.enabled)
                continue;

            let commission = 0;

            if (rate.rate > 0)
                commission = roundMoney(payment.amount * (rate.rate / 100), 'USD');

            commission = Math.max(rate.minAmount, commission);

            if (rate.maxAmount)
                commission = Math.min(rate.maxAmount, commission);

            if (commission <= 0)
                continue;

            await this.payout(level, rate, commission, currReferral, payment);
        }
    }

    private async getReferralPath(startReferral: Referral, maxDepth: number): Promise<Referral[]> {
        let currReferral: Referral | undefined = startReferral;

        const referrals: Referral[] = [startReferral];

        for (let i = 1; i < maxDepth; i++) {
            currReferral = await this.referralManager.getByReferee(currReferral.referrer.userId);

            if (!currReferral)
                break;

            referrals.push(currReferral);
        }

        return referrals;
    }

    private async payout(
        level: number,
        rate: ReferralCommissionRate,
        amount: number,
        referral: Referral,
        payment: Payment): Promise<void> {
        const sourceType = this.mapSourceType(payment);

        if (!sourceType)
            return;

        const entry = await this.ledger.transfer(amount, 'USD')
            .purpose(TransactionPurpose.ReferralPayout)
            .requestedBy(RequesterType.System, 'Referral')
            .externalRef(`Referral:${referral.id}:${sourceType}:${payment.id}`)
            .fromPlatform(PlatformWallets.Referral)
            .toUser(referral.referrer.userId, UserWalletAccounts.Withdrawable)
            .commit();

        await this.referralManager.addReward({
            type: ReferralRewardType.Commission,
            event: ReferralEventType.Payment,
            commission: amount,
            level,
            rate: rate.rate,
            referralId: referral.id,
            sourceAmount: payment.amount,
            sourceType,
            sourceId: payment.id,
            userId: referral.referrer.userId,
            walletEntryId: entry.id
        });

        const referralRevenue = await this.referralManager.adjustRevenue(referral.id, amount);
        const referrerRevenue = await this.userManager.adjustRevenue(referral.referrer.userId, amount);

        referral.revenue = referralRevenue;
        referral.referrer.revenue = referrerRevenue;
    }

    private mapSourceType(payment: Payment): ReferralCommissionType | undefined {
        switch (payment.type) {
            case PaymentType.Purchase:
                return ReferralCommissionType.Purchase;

            case PaymentType.Subscription:
                return ReferralCommissionType.Subscription;
        }

        return undefined;
    }
}