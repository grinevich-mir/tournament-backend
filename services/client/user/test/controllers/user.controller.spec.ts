import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, verify, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { UserController } from '../../src/controllers/user.controller';
import { UserManager, User, UserAddressStatus, UserVerificationStatus, UserRegistrationType, UserType, DisplayNameValidationResult } from '@tcom/platform/lib/user';
import { UserModelMapper, UserModel, UserDisplayNameCheckModel, UserDisplayNameChangeModel, UserCurrencyChangeModel, UserCountryChangeModel } from '@tcom/platform/lib/user/models';
import { ForbiddenError, GeoIpInfo } from '@tcom/platform/lib/core';

describe('UserController', () => {
    const mockUserManager = mock(UserManager);
    const mockMapper = mock(UserModelMapper);

    function getController(): UserController {
        return new UserController(
            instance(mockUserManager),
            instance(mockMapper));
    }

    beforeEach(() => {
        reset(mockUserManager);
        reset(mockMapper);
    });

    describe('get()', () => {
        it('should update user ip if it has changed and return the user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const ipAddress = '192.168.0.1';
            const geoIp: GeoIpInfo = {
                ip: ipAddress,
                country: 'GB'
            };

            const user: User = {
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
                skinId,
                type: userType,
                enabled: true,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false,
                createTime: new Date(),
                updateTime: new Date(),
                fraudulent: false,
            };

            const userModel: UserModel = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                regCountry: 'US',
                country: 'US',
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                secureId: userSecureId,
                skinId,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false
            };

            when(mockMapper.map(user)).thenReturn(userModel);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user,
                ip: ipAddress,
                geoIp
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.equal(userModel);
            verify(mockUserManager.updateIpData(userId, ipAddress, geoIp)).once();
        });

        it('should return the user even if an error occurs trying to set the country', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const ipAddress = '192.168.0.1';
            const country = 'US';
            const state = 'ML';
            const geoIp: GeoIpInfo = {
                ip: ipAddress,
                country,
                regionCode: state
            };

            const user: User = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                regType: UserRegistrationType.Email,
                secureId: userSecureId,
                ipAddress,
                skinId,
                type: userType,
                enabled: true,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false,
                createTime: new Date(),
                updateTime: new Date(),
                fraudulent: false,
            };

            const userModel: UserModel = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                regCountry: country,
                country,
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                secureId: userSecureId,
                skinId,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false
            };

            when(mockUserManager.setRegLocation(userId, country, state)).thenReject(new Error('Invalid'));
            when(mockMapper.map(user)).thenReturn(userModel);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user,
                ip: ipAddress,
                geoIp
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.equal(userModel);
            verify(mockUserManager.setRegLocation(userId, country, state)).once();
        });

        it('should update user reg country if it is not set return the user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const ipAddress = '192.168.0.1';
            const country = 'US';
            const state = 'ML';
            const geoIp: GeoIpInfo = {
                ip: ipAddress,
                country,
                regionCode: state
            };

            const user: User = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                regType: UserRegistrationType.Email,
                secureId: userSecureId,
                ipAddress,
                skinId,
                type: userType,
                enabled: true,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false,
                createTime: new Date(),
                updateTime: new Date(),
                fraudulent: false,
            };

            const userModel: UserModel = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                regCountry: country,
                country,
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                secureId: userSecureId,
                skinId,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false
            };

            when(mockMapper.map(user)).thenReturn(userModel);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user,
                ip: ipAddress,
                geoIp
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.equal(userModel);
            verify(mockUserManager.setRegLocation(userId, country, state)).once();
        });

        it('should update user country if it is not set return the user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const ipAddress = '192.168.0.1';
            const country = 'US';
            const state = 'ML';
            const geoIp: GeoIpInfo = {
                ip: ipAddress,
                country,
                regionCode: state
            };

            const user: User = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                regType: UserRegistrationType.Email,
                secureId: userSecureId,
                regCountry: country,
                regState: state,
                ipAddress,
                skinId,
                type: userType,
                enabled: true,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false,
                createTime: new Date(),
                updateTime: new Date(),
                fraudulent: false,
            };

            const userModel: UserModel = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                regCountry: country,
                country,
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                secureId: userSecureId,
                skinId,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false
            };

            when(mockMapper.map(user)).thenReturn(userModel);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user,
                ip: ipAddress,
                geoIp
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.equal(userModel);
            verify(mockUserManager.setCountry(userId, country)).once();
        });

        it('should return the user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const user: User = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                country: 'US',
                regCountry: 'US',
                regState: 'NY',
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                regType: UserRegistrationType.Email,
                secureId: userSecureId,
                skinId,
                type: userType,
                enabled: true,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false,
                createTime: new Date(),
                updateTime: new Date(),
                fraudulent: false,
            };

            const userModel: UserModel = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                regCountry: 'US',
                country: 'US',
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                secureId: userSecureId,
                skinId,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false
            };

            when(mockMapper.map(user)).thenReturn(userModel);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.equal(userModel);
        });
    });

    describe('checkDisplayName()', () => {
        it('should validate the display name', async () => {
            // Given
            const check: UserDisplayNameCheckModel = {
                name: 'Name'
            };

            const checkResult: DisplayNameValidationResult = {
                available: true,
                valid: true
            };

            when(mockUserManager.validateDisplayName(check.name, undefined)).thenResolve(checkResult);

            const controller = getController();

            // When
            const result = await controller.checkDisplayName(check);

            // Then
            expect(result).to.equal(checkResult);
        });

        context('user is logged in', () => {
            it('should validate the display name', async () => {
                // Given
                const userId = 1;
                const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
                const skinId = 'tournament';
                const userType = UserType.Standard;

                const check: UserDisplayNameCheckModel = {
                    name: 'Name'
                };

                const checkResult: DisplayNameValidationResult = {
                    available: true,
                    valid: true
                };

                when(mockUserManager.validateDisplayName(check.name, userId)).thenResolve(checkResult);

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
                const result = await controller.checkDisplayName(check);

                // Then
                expect(result).to.equal(checkResult);
            });
        });
    });

    describe('setDisplayName()', () => {
        it('should throw forbidden error if user is not high enough level', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const displayName = 'Name';

            const change: UserDisplayNameChangeModel = {
                name: displayName
            };

            const user: User = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                displayName: 'OriginalName',
                country: 'US',
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 0,
                regType: UserRegistrationType.Email,
                secureId: userSecureId,
                skinId,
                type: userType,
                enabled: true,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false,
                createTime: new Date(),
                updateTime: new Date(),
                fraudulent: false,
            };

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.setDisplayName(change);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'You do not have access to this feature');
        });

        it('should set the users display name', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const displayName = 'Name';

            const change: UserDisplayNameChangeModel = {
                name: displayName
            };

            const user: User = {
                id: userId,
                chatToken: 'ABC12345',
                consecutivePlayedDays: 1,
                country: 'US',
                addressStatus: UserAddressStatus.Pending,
                identityStatus: UserVerificationStatus.Pending,
                level: 1,
                regType: UserRegistrationType.Email,
                secureId: userSecureId,
                skinId,
                type: userType,
                enabled: true,
                subscribed: false,
                subscribing: false,
                hasPaymentMethod: false,
                createTime: new Date(),
                updateTime: new Date(),
                fraudulent: false,
            };

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            await controller.setDisplayName(change);

            // Then
            verify(mockUserManager.setDisplayName(userId, displayName)).once();
        });
    });

    describe('setCurrencyCode()', () => {
        it('should set the users currency code', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const currencyCode = 'Name';

            const change: UserCurrencyChangeModel = {
                currencyCode
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
            await controller.setCurrency(change);

            // Then
            verify(mockUserManager.setCurrency(userId, currencyCode)).once();
        });
    });

    describe('setCountry()', () => {
        it('should throw forbidden error if user is not high enough level', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const country = 'US';

            const change: UserCountryChangeModel = {
                country
            };

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level: 0
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.setCountry(change);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'You do not have access to this feature');
        });

        it('should set the users country', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const country = 'US';

            const change: UserCountryChangeModel = {
                country
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
            await controller.setCountry(change);

            // Then
            verify(mockUserManager.setCountry(userId, country)).once();
        });
    });
});