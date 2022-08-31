import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, mockUserRequest, verify, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { AvatarController } from '../../src/controllers/avatar.controller';
import { UserManager, UserAvatarManager, UserAvatar, UserType, User } from '@tcom/platform/lib/user';
import { UserModelMapper, UserAvatarModel, UserAvatarUpdateModel } from '@tcom/platform/lib/user/models';
import { AvatarProcessor, AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';
import { UploadProcessor } from '../../src/utilities';
import { ForbiddenError } from '@tcom/platform/lib/core';

describe('ProfileController', () => {
    const mockAvatarManager = mock(UserAvatarManager);
    const mockUserManager = mock(UserManager);
    const mockMapper = mock(UserModelMapper);
    const mockUploadProcessor = mock(UploadProcessor);
    const mockAvatarProcessor = mock(AvatarProcessor);
    const mockAvatarUrlResolver = mock(AvatarUrlResolver);

    function getController(): AvatarController {
        return new AvatarController(
            instance(mockAvatarManager),
            instance(mockUserManager),
            instance(mockMapper),
            instance(mockUploadProcessor),
            instance(mockAvatarProcessor),
            instance(mockAvatarUrlResolver));
    }

    beforeEach(() => {
        reset(mockUserManager);
    });

    describe('getAll()', () => {
        it('should return avatars', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const avatars: UserAvatar[] = [{
                id: 1,
                skinId,
                url: 'https://an-avatar-url.com/avatar.jpg'
            }];

            const avatarModel: UserAvatarModel = {
                id: 1,
                url: 'https://an-avatar-url.com/avatar.jpg'
            };

            when(mockAvatarManager.getAll(skinId)).thenResolve(avatars);
            when(mockMapper.mapAvatar(avatars[0])).thenReturn(avatarModel);

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
            expect(result[0]).to.equal(avatarModel);
        });
    });

    describe('set()', () => {
        it('should throw forbidden error if user is not high enough level', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const avatarId = 1;

            const update: UserAvatarUpdateModel = {
                id: avatarId
            };

            const avatar: UserAvatar = {
                id: 1,
                skinId,
                url: 'https://an-avatar-url.com/avatar.jpg'
            };

            const avatarModel: UserAvatarModel = {
                id: 1,
                url: 'https://an-avatar-url.com/avatar.jpg'
            };

            when(mockUserManager.setAvatar(userId, avatarId)).thenResolve(avatar);
            when(mockMapper.mapAvatar(avatar)).thenReturn(avatarModel);

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
            const delegate = async () => controller.set(update);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'You do not have access to this feature');
        });

        it('should set the users avatar', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const avatarId = 1;

            const update: UserAvatarUpdateModel = {
                id: avatarId
            };

            const avatar: UserAvatar = {
                id: 1,
                skinId,
                url: 'https://an-avatar-url.com/avatar.jpg'
            };

            const avatarModel: UserAvatarModel = {
                id: 1,
                url: 'https://an-avatar-url.com/avatar.jpg'
            };

            when(mockUserManager.setAvatar(userId, avatarId)).thenResolve(avatar);
            when(mockMapper.mapAvatar(avatar)).thenReturn(avatarModel);

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
            const result = await controller.set(update);

            // Then
            expect(result).to.equal(avatarModel);
        });
    });

    describe('upload()', () => {
        it('should throw forbidden error if user is not high enough level', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    level: 0
                }),
                file: undefined
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.upload();

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'You do not have access to this feature');
        });

        it('should throw upload failed error if request has file missing', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                }),
                file: undefined
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.upload();

            // Then
            await expect(delegate()).to.be.rejectedWith(Error, 'Upload failed');
        });

        it('should save avatar and return URL', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const avatarId = '3dfb1b0d-ec60-4dae-ac96-f988709e6176';
            const avatarUrl = 'https://custom-avatar-url.com/avatar.jpg';

            const file = {
                buffer: new Buffer(10)
            } as Express.Multer.File;

            when(mockAvatarProcessor.processBuffer(file.buffer)).thenResolve(avatarId);
            when(mockAvatarUrlResolver.resolve(avatarId)).thenReturn(avatarUrl);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                }),
                file
            });

            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.upload();

            // Then
            expect(result).to.equal(avatarUrl);
            verify(mockUserManager.setCustomAvatar(userId, avatarId)).once();
        });
    });
});