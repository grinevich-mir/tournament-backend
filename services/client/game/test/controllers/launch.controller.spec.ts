import { describe, it } from '@tcom/test';
import { mock, when, instance, mockUserRequest, reset, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { LaunchController } from '../../src/controllers/launch.controller';
import { GameSessionManager, GameSession, GameProvider, GameSessionStatus, GameSessionStartResult, Game, GameType, GameOrientation } from '@tcom/platform/lib/game';
import { DeviceType } from '@tcom/platform/lib/core';
import { HtmlResult } from '@tcom/platform/lib/api';
import { User, UserType } from '@tcom/platform/lib/user';

describe('LaunchController', () => {
    const mockManager = mock(GameSessionManager);

    function getController(): LaunchController {
        return new LaunchController(instance(mockManager));
    }

    beforeEach(() => {
        reset(mockManager);
    });

    describe('launch()', () => {
        it('should return HTML error page result when session fails to start', async () => {
            // Given
            const gameId = 1;
            const currency = 'USD';
            const lang = 'en';
            const deviceType = DeviceType.Desktop;

            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const error = new Error('Test error');

            when(mockManager.start(gameId, userId, currency, lang, undefined, deviceType)).thenThrow(error);

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
            const result = await controller.launch(gameId, currency, lang, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.equal(error);
        });

        it('should return HTML redirect page result when session is started', async () => {
            // Given
            const gameId = 1;
            const gameProvider = GameProvider.Revolver;
            const currency = 'USD';
            const lang = 'en';
            const deviceType = DeviceType.Desktop;
            const gameRedirectUrl = 'https://game.redirect-url.com';

            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const game: Game = {
                id: gameId,
                name: 'Game 1',
                provider: gameProvider,
                thumbnail: 'a-thumbnail.jpg',
                orientation: GameOrientation.All,
                type: GameType.Slot,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const session: GameSession = {
                id: 1,
                secureId: 'bd207b8d-8b03-4399-8a14-dd20faac820f',
                currencyCode: currency,
                gameId,
                language: lang,
                provider: gameProvider,
                status: GameSessionStatus.Created,
                metadata: {},
                userId,
                expireTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            };

            const startResult: GameSessionStartResult = {
                game,
                session,
                redirectUrl: gameRedirectUrl
            };

            when(mockManager.start(gameId, userId, currency, lang, undefined, deviceType)).thenResolve(startResult);

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
            const result = await controller.launch(gameId, currency, lang, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/redirect.html');
            expect(result.data).to.exist.with.property('url').that.equals(startResult.redirectUrl);
        });
    });

    describe('play()', () => {
        it('should return HTML error page result when session fails to be resumed', async () => {
            // Given
            const deviceType = DeviceType.Desktop;
            const sessionId = 'bd207b8d-8b03-4399-8a14-dd20faac820f';

            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const error = new Error('Test error');

            when(mockManager.resume(sessionId, deviceType)).thenThrow(error);

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
            const result = await controller.play(sessionId, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.equal(error);
        });

        it('should return HTML redirect page result when session is resumed', async () => {
            // Given
            const gameId = 1;
            const gameProvider = GameProvider.Revolver;
            const currency = 'USD';
            const lang = 'en';
            const deviceType = DeviceType.Desktop;
            const gameRedirectUrl = 'https://game.redirect-url.com';
            const sessionId = 'bd207b8d-8b03-4399-8a14-dd20faac820f';

            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const game: Game = {
                id: gameId,
                name: 'Game 1',
                provider: gameProvider,
                thumbnail: 'a-thumbnail.jpg',
                orientation: GameOrientation.All,
                type: GameType.Slot,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const session: GameSession = {
                id: 1,
                secureId: sessionId,
                currencyCode: currency,
                gameId,
                language: lang,
                provider: gameProvider,
                status: GameSessionStatus.Created,
                metadata: {},
                userId,
                expireTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            };

            const startResult: GameSessionStartResult = {
                game,
                session,
                redirectUrl: gameRedirectUrl
            };

            when(mockManager.resume(sessionId, deviceType)).thenResolve(startResult);

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
            const result = await controller.play(sessionId, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/redirect.html');
            expect(result.data).to.exist.with.property('url').that.equals(startResult.redirectUrl);
        });
    });
});