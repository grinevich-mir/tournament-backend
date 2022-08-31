import { PagedResult } from '@tcom/platform/lib/core';
import { User, UserType } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { instance, mock, mockUser, mockUserRequest, reset, when, deepEqual } from '@tcom/test/mock';
import { RewardController } from '../../src/controllers/reward.controller';
import { ReferralUserManager, ReferralReward, ReferralRewardType, ReferralEventType } from '@tcom/platform/lib/referral';
import { ReferralRewardModelMapper } from '../../src/models/mappers';
import { ReferralRewardModel } from '../../src/models';

describe('RewardController', () => {
    const mockReferralUserManager = mock(ReferralUserManager);
    const mockReferralRewardMapper = mock(ReferralRewardModelMapper);

    function getController(): RewardController {
        return new RewardController(
            instance(mockReferralUserManager),
            instance(mockReferralRewardMapper),);
    }

    beforeEach(() => {
        reset(mockReferralUserManager);
        reset(mockReferralRewardMapper);
    });

    describe('getAll()', async () => {
        it('should return the rewards for the authenticated user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const page = 1;
            const pageSize = 20;

            const rewards: ReferralReward[] = [
                {
                    id: 1,
                    type: ReferralRewardType.Diamonds,
                    amount: 10,
                    event: ReferralEventType.SignUp,
                    referral: {
                        id: 1,
                        referee: {
                            userId: 1,
                            active: true,
                            code: 'ABC12345',
                            slug: 'ABC12345',
                            groupId: 1,
                            referralCount: 0,
                            revenue: 0,
                            rewardCount: 0,
                            diamondCount: 0,
                            createTime: new Date(),
                            updateTime: new Date()
                        },
                        referrer: {
                            userId: 2,
                            active: true,
                            code: '12345ABC',
                            slug: '12345ABC',
                            groupId: 1,
                            referralCount: 0,
                            revenue: 0,
                            rewardCount: 0,
                            diamondCount: 0,
                            createTime: new Date(),
                            updateTime: new Date()
                        },
                        rewardCount: 0,
                        revenue: 0,
                        diamondCount: 0,
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    referralId: 1,
                    userId: 1,
                    walletEntryId: 123,
                    createTime: new Date()
                }
            ];

            const rewardModels: ReferralRewardModel[] = [
                {
                    id: 1,
                    type: ReferralRewardType.Diamonds,
                    amount: 10,
                    event: ReferralEventType.SignUp,
                    referral: {
                        id: 1,
                        active: true,
                        displayName: '12345ABC',
                        revenue: 0,
                        rewardCount: 0,
                        diamondCount: 0,
                        createTime: new Date(),
                        updateTime: new Date()
                    },
                    createTime: new Date()
                }
            ];

            const pagedReferrals = new PagedResult<ReferralReward>(rewards, 0, page, pageSize);

            when(mockReferralUserManager.getRewards(userId, deepEqual({
                type: undefined,
                page,
                pageSize,
                order: {
                    createTime: 'DESC'
                }
            }))).thenResolve(pagedReferrals);
            when(mockReferralRewardMapper.map(rewards[0])).thenResolve(rewardModels[0]);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll(undefined);

            // Then
            expect(result.items).to.have.members(rewardModels);
        });
    });
});