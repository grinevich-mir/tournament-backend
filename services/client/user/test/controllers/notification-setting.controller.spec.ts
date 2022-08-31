import { UserNotificationSetting, UserNotificationSettingManager, UserType, UserNotificationSettingUpdate, UserNotificationChannel, User, UserManager, UserAddressStatus, UserVerificationStatus, UserRegistrationType } from '@tcom/platform/lib/user';
import { describe, it } from '@tcom/test';
import { mock, instance, when, mockUserRequest, verify, mockUser, reset, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { NotificationSettingController } from '../../src/controllers/notification-setting.controller';
import { BadRequestError, NotFoundError } from '@tcom/platform/lib/core';

describe('NotificationSettingController', () => {
    const mockNotificationManager = mock(UserNotificationSettingManager);
    const mockUserManager = mock(UserManager);

    function getController(): NotificationSettingController {
        return new NotificationSettingController(
            instance(mockNotificationManager),
            instance(mockUserManager));
    }

    const userId = 1;
    const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
    const skinId = 'tournament';
    const userType = UserType.Standard;
    const channel = UserNotificationChannel.Email;

    const userProfile: User = {
        id: userId,
        chatToken: 'ABC12345',
        consecutivePlayedDays: 1,
        country: 'US',
        addressStatus: UserAddressStatus.Pending,
        identityStatus: UserVerificationStatus.Pending,
        level: 0,
        regType: UserRegistrationType.Email,
        secureId: userSecureId,
        ipAddress: '192.168.0.2',
        skinId: 'tournament',
        type: UserType.Standard,
        enabled: true,
        subscribed: false,
        subscribing: false,
        hasPaymentMethod: false,
        createTime: new Date(),
        updateTime: new Date(),
        fraudulent: false,
    };

    beforeEach(() => {
        reset(mockNotificationManager);
        reset(mockUserManager);
    });

    describe('getAll()', () => {
        it('should return user notification settings', async () => {
            // Given
            const settings: UserNotificationSetting[] = [];

            when(mockNotificationManager.getAll(userId)).thenResolve(settings);

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
            const result = await controller.getAll();

            // Then
            expect(result).to.equal(settings);
        });
    });

    describe('update()', () => {
        it('should throw a no settings supplied error when there are no properties on update', async () => {
            // Given
            const update: UserNotificationSettingUpdate = {};

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
            const delegate = async () => controller.update(channel, update);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'No settings supplied');
        });

        it('should update the specified setting', async () => {
            // Given
            const update: UserNotificationSettingUpdate = {
                account: true
            };

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
            await controller.update(channel, update);

            // Then
            verify(mockNotificationManager.set(userId, channel, update)).once();
        });
    });

    describe('disable()', () => {
        it('should throw an user no found error when no user is returned with secureId', async () => {
            // Given
            const update: UserNotificationSettingUpdate = {
                account: false
            };

            const controller = getController();

            // When
            const disable = async () => controller.disable(userSecureId, channel, update);

            // Then
            await expect(disable()).to.be.rejectedWith(NotFoundError, 'User not found');
        });

        it('should disable the specified settings', async () => {
            // Given
            const update: UserNotificationSettingUpdate = {
                account: false
            };

            when(mockUserManager.get(userSecureId)).thenResolve(userProfile);

            const controller = getController();

            // When
            await controller.disable(userSecureId, channel, update);

            // Then
            verify(mockNotificationManager.set(userId, channel, update)).once();
        });

        it('should disable all subscriptions when an empty object is passed to the body', async () => {
            // Given
            const update: UserNotificationSettingUpdate = {};

            when(mockUserManager.get(userSecureId)).thenResolve(userProfile);

            const controller = getController();

            // When
            await controller.disable(userSecureId, channel, update);

            const disableAll: UserNotificationSettingUpdate = {
                account: false,
                prize: false,
                marketing: false,
            };

            // Then
            verify(mockNotificationManager.set(userId, channel, deepEqual(disableAll))).once();
        });
    });
});
