import { NotFoundError } from '@tcom/platform/lib/core';
import { User, UserManager } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { instance, mock, reset, when } from '@tcom/test/mock';
import { Referral } from '@tcom/platform/lib/referral';
import { ReferralModelMapper } from '../../../src/models/mappers';

describe('ReferralModelMapper', () => {
    const mockUserManager = mock(UserManager);

    function getMapper(): ReferralModelMapper {
        return new ReferralModelMapper(
            instance(mockUserManager));
    }

    beforeEach(() => {
        reset(mockUserManager);
    });

    describe('map()', async () => {
        it('should throw a not found error if the referee user does not exist', async () => {
            // Given
            const referral: Referral = {
                id: 1,
                referrer: {
                    userId: 1,
                    active: false,
                    code: 'ABC12345',
                    groupId: 1,
                    referralCount: 0,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    slug: '12345ABC',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: 2,
                    active: false,
                    code: 'ABC12345',
                    groupId: 1,
                    referralCount: 0,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    slug: '12345ABC',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                createTime: new Date(),
                updateTime: new Date()
            };

            const mapper = getMapper();

            // When
            const delegate = async () => mapper.map(referral);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Referee user not found');
        });

        it('should return a referral model with anonymous display name if one is not set', async () => {
            // Given
            const refereeUserId = 500;

            const user = {
                id: refereeUserId
            } as User;

            const referral: Referral = {
                id: 1,
                referrer: {
                    userId: 1,
                    active: false,
                    code: 'ABC12345',
                    groupId: 1,
                    referralCount: 0,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    slug: '12345ABC',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: refereeUserId,
                    active: false,
                    code: 'ABC12345',
                    groupId: 1,
                    referralCount: 0,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    slug: '12345ABC',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockUserManager.get(refereeUserId)).thenResolve(user);

            const mapper = getMapper();

            // When
            const model = await mapper.map(referral);

            // Then
            expect(model).to.deep.equal({
                id: 1,
                displayName: 'Anonymous',
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                active: false,
                createTime: referral.createTime,
                updateTime: referral.updateTime
            });
        });

        it('should return a referral model', async () => {
            // Given
            const refereeUserId = 500;
            const displayName = 'Wooble';

            const user = {
                id: refereeUserId,
                displayName
            } as User;

            const referral: Referral = {
                id: 1,
                referrer: {
                    userId: 1,
                    active: false,
                    code: 'ABC12345',
                    groupId: 1,
                    referralCount: 0,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    slug: '12345ABC',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                referee: {
                    userId: refereeUserId,
                    active: false,
                    code: 'ABC12345',
                    groupId: 1,
                    referralCount: 0,
                    revenue: 0,
                    rewardCount: 0,
                    diamondCount: 0,
                    slug: '12345ABC',
                    createTime: new Date(),
                    updateTime: new Date()
                },
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockUserManager.get(refereeUserId)).thenResolve(user);

            const mapper = getMapper();

            // When
            const model = await mapper.map(referral);

            // Then
            expect(model).to.deep.equal({
                id: 1,
                displayName,
                revenue: 0,
                rewardCount: 0,
                diamondCount: 0,
                active: false,
                createTime: referral.createTime,
                updateTime: referral.updateTime
            });
        });
    });
});