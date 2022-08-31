import { NotFoundError } from '@tcom/platform/lib/core';
import { User, UserManager } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { instance, mock, reset, when } from '@tcom/test/mock';
import { ReferralUser, ReferralGroupManager, ReferralGroup } from '@tcom/platform/lib/referral';
import { ReferralUserModelMapper, ReferralGroupModelMapper } from '../../../src/models/mappers';
import { AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';
import { ReferralGroupModel } from '../../../src/models';

describe('ReferralUserModelMapper', () => {
    const mockUserManager = mock(UserManager);
    const mockAvatarUrlResolver = mock(AvatarUrlResolver);
    const mockReferralGroupManager = mock(ReferralGroupManager);
    const mockReferralGroupMapper = mock(ReferralGroupModelMapper);

    function getMapper(): ReferralUserModelMapper {
        return new ReferralUserModelMapper(
            instance(mockUserManager),
            instance(mockAvatarUrlResolver),
            instance(mockReferralGroupManager),
            instance(mockReferralGroupMapper));
    }

    beforeEach(() => {
        reset(mockUserManager);
        reset(mockAvatarUrlResolver);
        reset(mockReferralGroupManager);
    });

    describe('map()', async () => {
        it('should throw a not found error if referral user group does not exist', async () => {
            // Given
            const referralUser: ReferralUser = {
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
            };

            const mapper = getMapper();

            // When
            const delegate = async () => mapper.map(referralUser);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Referral group not found');
        });
    });

    it('should return a referral user model', async () => {
        // Given
        const userId = 500;

        const referralGroup: ReferralGroup = {
            id: 1,
            default: false,
            name: 'Group 1',
            createTime: new Date(),
            updateTime: new Date()
        };

        const referralUser: ReferralUser = {
            userId,
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
        };

        const referralGroupModel: ReferralGroupModel = {
            id: 1,
            name: 'Group 1'
        };

        when(mockReferralGroupManager.get(referralUser.groupId)).thenResolve(referralGroup);
        when(mockReferralGroupMapper.map(referralGroup)).thenReturn(referralGroupModel);

        const mapper = getMapper();

        // When
        const model = await mapper.map(referralUser);

        // Then
        expect(model).to.deep.equal({
            active: false,
            revenue: referralUser.revenue,
            referralCount: referralUser.referralCount,
            rewardCount: referralUser.rewardCount,
            diamondCount: referralUser.diamondCount,
            code: referralUser.code,
            group: referralGroupModel,
            slug: referralUser.slug
        });
    });

    describe('mapPublic()', async () => {
        it('should throw a not found error if the user does not exist', async () => {
            // Given
            const referralUser: ReferralUser = {
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
            };

            const mapper = getMapper();

            // When
            const delegate = async () => mapper.mapPublic(referralUser);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'User not found');
        });

        it('should return a public referral user model with anonymous display name if one is not set', async () => {
            // Given
            const userId = 500;
            const avatarUrl = 'https://avatars.com/1';

            const user = {
                id: userId
            } as User;

            const referralUser: ReferralUser = {
                userId,
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
            };

            when(mockUserManager.get(userId)).thenResolve(user);
            when(mockAvatarUrlResolver.resolve(user)).thenReturn(avatarUrl);

            const mapper = getMapper();

            // When
            const model = await mapper.mapPublic(referralUser);

            // Then
            expect(model).to.deep.equal({
                code: referralUser.code,
                slug: referralUser.slug,
                displayName: 'Anonymous',
                avatarUrl
            });
        });
    });
});