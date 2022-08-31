import { describe, it } from '@tcom/test';
import { deepEqual, instance, mock, reset, verify, when } from '@tcom/test/mock';
import { Referral, ReferralCommissionType, ReferralManager, ReferralUser, ReferralCommissionManager, ReferralCommissionRate, NewReferralReward, ReferralEventType, ReferralUserManager, ReferralCommissionProcessor } from '../../src/referral';
import { Ledger, PlatformWallets, UserWalletAccounts, TransactionPurpose, RequesterType } from '../../src/banking';
import { ReferralRewardType } from '../../src/referral/referral-reward-type';
import { Payment, PaymentMethodType, PaymentProvider, PaymentStatus, PaymentType } from '../../src/payment';
import { TransferBuilder } from '../../src/banking/transfer';
import { WalletEntry } from '../../lib/banking';

describe('AwardCommissionActionProcessor', () => {
    const mockReferralManager = mock(ReferralManager);
    const mockReferralUserManager = mock(ReferralUserManager);
    const mockCommissionManager = mock(ReferralCommissionManager);
    const mockLedger = mock(Ledger);

    function getProcessor(): ReferralCommissionProcessor {
        return new ReferralCommissionProcessor(
            instance(mockReferralManager),
            instance(mockReferralUserManager),
            instance(mockCommissionManager),
            instance(mockLedger)
        );
    }

    beforeEach(() => {
        reset(mockReferralManager);
        reset(mockReferralUserManager),
        reset(mockCommissionManager);
        reset(mockLedger);
    });

    describe('process()', () => {
        it('should payout to all referrers if everything is active/enabled', async () => {
            // Given
            const groupId = 1;
            const sourceType = ReferralCommissionType.Purchase;
            const sourceId = 1;
            const event = ReferralEventType.Payment;

            const payment: Payment = {
                id: 1,
                amount: 100,
                paymentMethod: {
                    id: 1,
                    type: PaymentMethodType.PayPal,
                    email: 'waffle@doop.com',
                    provider: PaymentProvider.PayPal,
                    providerRef: 'ABC1234',
                    userId: 1,
                    metadata: {},
                    enabled: true,
                    createTime: new Date(),
                    updateTime: new Date()
                },
                paymentMethodId: 1,
                provider: PaymentProvider.PayPal,
                providerRef: '1234ABC',
                status: PaymentStatus.Successful,
                type: PaymentType.Purchase,
                currencyCode: 'USD',
                userId: 1,
                createTime: new Date(),
                updateTime: new Date()
            };

            const rates: ReferralCommissionRate[] = [
                {
                    level: 1,
                    groupId,
                    enabled: true,
                    rate: 10,
                    minAmount: 0,
                    createTime: new Date(),
                    updateTime: new Date()
                },
                {
                    level: 2,
                    groupId,
                    enabled: true,
                    rate: 5,
                    minAmount: 0,
                    createTime: new Date(),
                    updateTime: new Date()
                },
                {
                    level: 3,
                    groupId,
                    enabled: true,
                    rate: 2.5,
                    minAmount: 0,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const referralUser1: ReferralUser = {
                userId: 1,
                code: 'ABC1235',
                groupId: 1,
                revenue: 0,
                referralCount: 0,
                rewardCount: 0,
                diamondCount: 0,
                slug: 'ABC1235',
                active: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referralUser2: ReferralUser = {
                userId: 2,
                code: 'ABC1235',
                groupId: 1,
                revenue: 0,
                referralCount: 0,
                rewardCount: 0,
                diamondCount: 0,
                slug: 'ABC1235',
                active: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referralUser3: ReferralUser = {
                userId: 3,
                code: 'ABC1235',
                groupId: 1,
                revenue: 0,
                referralCount: 0,
                rewardCount: 0,
                diamondCount: 0,
                slug: 'ABC1235',
                active: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referralUser4: ReferralUser = {
                userId: 4,
                code: 'ABC1235',
                groupId: 1,
                revenue: 0,
                referralCount: 0,
                rewardCount: 0,
                diamondCount: 0,
                slug: 'ABC1235',
                active: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referralUser5: ReferralUser = {
                userId: 5,
                code: 'ABC1235',
                groupId: 1,
                revenue: 0,
                referralCount: 0,
                rewardCount: 0,
                diamondCount: 0,
                slug: 'ABC1235',
                active: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referral1: Referral = {
                id: 1,
                referrer: referralUser2,
                referee: referralUser1,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referral2: Referral = {
                id: 2,
                referrer: referralUser3,
                referee: referralUser2,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referral3: Referral = {
                id: 3,
                referrer: referralUser4,
                referee: referralUser3,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                createTime: new Date(),
                updateTime: new Date()
            };

            const referral4: Referral = {
                id: 4,
                referrer: referralUser5,
                referee: referralUser4,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                createTime: new Date(),
                updateTime: new Date()
            };

            const newReward1: NewReferralReward = {
                sourceAmount: payment.amount,
                sourceType,
                sourceId,
                commission: 10,
                rate: 10,
                level: 1,
                event,
                referralId: referral1.id,
                type: ReferralRewardType.Commission,
                userId: referral1.referrer.userId,
                walletEntryId: 1
            };

            const newReward2: NewReferralReward = {
                sourceAmount: payment.amount,
                sourceType,
                sourceId,
                commission: 5,
                rate: 5,
                level: 2,
                event,
                referralId: referral2.id,
                type: ReferralRewardType.Commission,
                userId: referral2.referrer.userId,
                walletEntryId: 2
            };

            const newReward3: NewReferralReward = {
                sourceAmount: payment.amount,
                sourceType,
                sourceId,
                commission: 2.5,
                rate: 2.5,
                level: 3,
                event,
                referralId: referral3.id,
                type: ReferralRewardType.Commission,
                userId: referral3.referrer.userId,
                walletEntryId: 3
            };

            const newReward4: NewReferralReward = {
                sourceAmount: payment.amount,
                sourceType,
                sourceId,
                commission: 1,
                rate: 1,
                level: 4,
                event,
                referralId: referral4.id,
                type: ReferralRewardType.Commission,
                userId: referral4.referrer.userId,
                walletEntryId: 4
            };

            const processor = getProcessor();

            when(mockCommissionManager.getRates(deepEqual({ enabled: true }))).thenResolve(rates);
            when(mockReferralManager.getByReferee(referralUser1.userId)).thenResolve(referral1);
            when(mockReferralManager.getByReferee(referralUser2.userId)).thenResolve(referral2);
            when(mockReferralManager.getByReferee(referralUser3.userId)).thenResolve(referral3);
            when(mockReferralManager.getByReferee(referralUser4.userId)).thenResolve(referral4);

            const externalRef1 = `Referral:${referral1.id}:${sourceType}:${payment.id}`;
            const walletEntry1: WalletEntry = {
                id: 1,
                purpose: TransactionPurpose.ReferralPayout,
                requesterType: RequesterType.System,
                requesterId: 'Referral',
                externalRef: externalRef1,
                createTime: new Date()
            };
            const externalRef2 = `Referral:${referral2.id}:${sourceType}:${payment.id}`;
            const walletEntry2: WalletEntry = {
                id: 2,
                purpose: TransactionPurpose.ReferralPayout,
                requesterType: RequesterType.System,
                requesterId: 'Referral',
                externalRef: externalRef2,
                createTime: new Date()
            };
            const externalRef3 = `Referral:${referral3.id}:${sourceType}:${payment.id}`;
            const walletEntry3: WalletEntry = {
                id: 3,
                purpose: TransactionPurpose.ReferralPayout,
                requesterType: RequesterType.System,
                requesterId: 'Referral',
                externalRef: externalRef3,
                createTime: new Date()
            };

            const transferBuilder1 = mock(TransferBuilder);
            when(mockLedger.transfer(newReward1.commission, 'USD')).thenReturn(instance(transferBuilder1));
            when(transferBuilder1.purpose(TransactionPurpose.ReferralPayout)).thenReturn(instance(transferBuilder1));
            when(transferBuilder1.requestedBy(RequesterType.System, 'Referral')).thenReturn(instance(transferBuilder1));
            when(transferBuilder1.externalRef(externalRef1)).thenReturn(instance(transferBuilder1));
            when(transferBuilder1.fromPlatform(PlatformWallets.Referral)).thenReturn(instance(transferBuilder1));
            when(transferBuilder1.toUser(referral1.referrer.userId, UserWalletAccounts.Withdrawable)).thenReturn(instance(transferBuilder1));
            when(transferBuilder1.commit()).thenResolve(walletEntry1);

            const transferBuilder2 = mock(TransferBuilder);
            when(mockLedger.transfer(newReward2.commission, 'USD')).thenReturn(instance(transferBuilder2));
            when(transferBuilder2.purpose(TransactionPurpose.ReferralPayout)).thenReturn(instance(transferBuilder2));
            when(transferBuilder2.requestedBy(RequesterType.System, 'Referral')).thenReturn(instance(transferBuilder2));
            when(transferBuilder2.externalRef(externalRef2)).thenReturn(instance(transferBuilder2));
            when(transferBuilder2.fromPlatform(PlatformWallets.Referral)).thenReturn(instance(transferBuilder2));
            when(transferBuilder2.toUser(referral2.referrer.userId, UserWalletAccounts.Withdrawable)).thenReturn(instance(transferBuilder2));
            when(transferBuilder2.commit()).thenResolve(walletEntry2);

            const transferBuilder3 = mock(TransferBuilder);
            when(mockLedger.transfer(newReward3.commission, 'USD')).thenReturn(instance(transferBuilder3));
            when(transferBuilder3.purpose(TransactionPurpose.ReferralPayout)).thenReturn(instance(transferBuilder3));
            when(transferBuilder3.requestedBy(RequesterType.System, 'Referral')).thenReturn(instance(transferBuilder3));
            when(transferBuilder3.externalRef(externalRef3)).thenReturn(instance(transferBuilder3));
            when(transferBuilder3.fromPlatform(PlatformWallets.Referral)).thenReturn(instance(transferBuilder3));
            when(transferBuilder3.toUser(referral3.referrer.userId, UserWalletAccounts.Withdrawable)).thenReturn(instance(transferBuilder3));
            when(transferBuilder3.commit()).thenResolve(walletEntry3);

            // When
            await processor.process(referral1, payment);

            // Then
            verify(mockReferralManager.getByReferee(referralUser4.userId)).never();
            verify(mockReferralManager.addReward(deepEqual(newReward1))).once();
            verify(mockReferralManager.addReward(deepEqual(newReward2))).once();
            verify(mockReferralManager.addReward(deepEqual(newReward3))).once();
            verify(mockReferralManager.addReward(deepEqual(newReward4))).never();
            verify(mockReferralManager.adjustRevenue(newReward1.referralId, newReward1.commission)).once();
            verify(mockReferralManager.adjustRevenue(newReward2.referralId, newReward2.commission)).once();
            verify(mockReferralManager.adjustRevenue(newReward3.referralId, newReward3.commission)).once();
            verify(mockReferralUserManager.adjustRevenue(newReward1.userId, newReward1.commission)).once();
            verify(mockReferralUserManager.adjustRevenue(newReward2.userId, newReward2.commission)).once();
            verify(mockReferralUserManager.adjustRevenue(newReward3.userId, newReward3.commission)).once();
        });
    });
});