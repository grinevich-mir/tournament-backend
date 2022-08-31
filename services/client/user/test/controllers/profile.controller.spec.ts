import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, verify, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { ProfileController } from '../../src/controllers/profile.controller';
import { User, UserManager, UserProfile, UserProfileUpdate, UserType } from '@tcom/platform/lib/user';
import { NotFoundError } from '@tcom/platform/lib/core';
import { UserModelMapper, UserProfileUpdateModel } from '@tcom/platform/lib/user/models';

describe('ProfileController', () => {
    const mockUserManager = mock(UserManager);
    const mockMapper = mock(UserModelMapper);

    function getController(): ProfileController{
        return new ProfileController(
            instance(mockUserManager),
            instance(mockMapper));
    }

    beforeEach(() => {
        reset(mockUserManager);
        reset(mockMapper);
    });

    describe('get()', () => {
        it('throw a not found error when the profile does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockUserManager.getProfile(userId)).thenResolve(undefined);

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
            const delegate = async () => controller.get();

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Profile not found');
        });

        it('should return the users profile', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const profile: UserProfile = {
                userId,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockUserManager.getProfile(userId)).thenResolve(profile);

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
            const result = await controller.get();

            // Then
            expect(result).to.equal(profile);
        });
    });

    describe('set()', () => {
        it('should set the users profile', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const model: UserProfileUpdateModel = {};
            const update: UserProfileUpdate = {};

            when(mockMapper.mapProfileUpdate(model)).thenReturn(update);

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
            await controller.set(model);

            // Then
            verify(mockUserManager.setProfile(userId, update)).once();
            expect(controller.getStatus()).to.equal(200);
        });
    });
});