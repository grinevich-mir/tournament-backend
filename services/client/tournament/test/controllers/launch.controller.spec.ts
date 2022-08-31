import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { LaunchController } from '../../src/controllers/launch.controller';
import { DeviceType, NotFoundError, ForbiddenError } from '@tcom/platform/lib/core';
import { TournamentEntryManager, TournamentManager } from '@tcom/platform/lib/tournament';
import { GameManager, GameSessionManager, Game, GameProvider, GameType, GameSession, NewGameSession, GameSessionStatus, GameOrientation } from '@tcom/platform/lib/game';
import { HtmlResult } from '@tcom/platform/lib/api';
import { generateTournamentEntry, generateTournament } from '../helpers';

describe('LaunchController', () => {
    const mockTournamentManager = mock(TournamentManager);
    const mockTournamentEntryManager = mock(TournamentEntryManager);
    const mockGameManager = mock(GameManager);
    const mockGameSessionManager = mock(GameSessionManager);

    function getController(): LaunchController {
        return new LaunchController(
            instance(mockTournamentManager),
            instance(mockTournamentEntryManager),
            instance(mockGameManager),
            instance(mockGameSessionManager));
    }

    beforeEach(() => {
        process.env.DOMAIN = 'test.com';

        reset(mockTournamentManager);
        reset(mockTournamentEntryManager);
        reset(mockGameManager);
        reset(mockGameSessionManager);
    });

    afterEach(() => {
        delete process.env.DOMAIN;
    });

    describe('launch()', () => {
        it('should return HTML error page when an unexpected error occurs', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const deviceType = DeviceType.Mobile;

            const controller = getController();

            when(mockTournamentEntryManager.getByToken(token)).thenThrow(new Error('An Error'));

            // When
            const result = await controller.launch(token, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.be.instanceOf(Error).with.property('message').equal('An Error');
            expect(controller.getStatus()).to.equal(500);
        });

        it('should return HTML error page when the entry does not exist', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const deviceType = DeviceType.Mobile;

            const controller = getController();

            // When
            const result = await controller.launch(token, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.be.instanceOf(NotFoundError).with.property('message').equal('Entry not found');
            expect(controller.getStatus()).to.equal(404);
        });

        it.skip('should return HTML error page when the entry has no allocations', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const deviceType = DeviceType.Mobile;

            const entry = generateTournamentEntry(1, 1);
            entry.allocations = [];

            when(mockTournamentEntryManager.getByToken(token)).thenResolve(entry);

            const controller = getController();

            // When
            const result = await controller.launch(token, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.be.instanceOf(ForbiddenError).with.property('message').equal('No unused allocations remaining');
            expect(controller.getStatus()).to.equal(403);
        });

        it.skip('should return HTML error page when the entry has no unused allocations', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const deviceType = DeviceType.Mobile;

            const entry = generateTournamentEntry(1, 1);
            entry.allocations.forEach(a => a.complete = true);

            when(mockTournamentEntryManager.getByToken(token)).thenResolve(entry);

            const controller = getController();

            // When
            const result = await controller.launch(token, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.be.instanceOf(ForbiddenError).with.property('message').equal('No unused allocations remaining');
        });

        it('should return HTML error page when the tournament does not exist', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const deviceType = DeviceType.Mobile;

            const entry = generateTournamentEntry(1, 1);

            when(mockTournamentManager.get(entry.tournamentId)).thenResolve(undefined);
            when(mockTournamentEntryManager.getByToken(token)).thenResolve(entry);

            const controller = getController();

            // When
            const result = await controller.launch(token, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.be.instanceOf(NotFoundError).with.property('message').equal('Tournament not found');
            expect(controller.getStatus()).to.equal(404);
        });

        it('should return HTML error page when the tournament game does not exist', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const deviceType = DeviceType.Mobile;

            const entry = generateTournamentEntry(1, 1);
            const tournament = generateTournament(1);

            when(mockTournamentManager.get(entry.tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.getByToken(token)).thenResolve(entry);
            when(mockGameManager.get(tournament.gameId)).thenResolve(undefined);

            const controller = getController();

            // When
            const result = await controller.launch(token, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/error.html');
            expect(result.data).to.be.instanceOf(NotFoundError).with.property('message').equal('Game 1 not found');
            expect(controller.getStatus()).to.equal(404);
        });

        it('should create a game session and return HTML redirect page result when no device type provided', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const language = 'en';
            const sessionSecureId = '007460c4-f9a5-4f3c-a473-eda3f8cd20b0';

            const entry = generateTournamentEntry(1, 1);
            const tournament = generateTournament(1);
            const sessionRef =`TE:${entry.id}`;
            const game: Game = {
                id: 1,
                name: 'Game 1',
                provider: GameProvider.Revolver,
                thumbnail: 'https://an-image-url.com/image.jpg',
                orientation: GameOrientation.All,
                type: GameType.Slot,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const newSession: NewGameSession = {
                gameId: tournament.gameId,
                provider: game.provider,
                userId: entry.userId,
                currencyCode: tournament.currencyCode,
                reference: sessionRef,
                language,
                metadata: {
                    tournamentId: tournament.id,
                    entryId: entry.id
                }
            };

            const gameSession: GameSession = {
                id: 1,
                secureId: sessionSecureId,
                currencyCode: tournament.currencyCode,
                gameId: tournament.gameId,
                language,
                metadata: {},
                reference: sessionRef,
                provider: game.provider,
                userId: entry.userId,
                status: GameSessionStatus.Created,
                expireTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            };

            const redirectUrl = `https://api.test.com/game/play/${gameSession.secureId}`;

            when(mockTournamentManager.get(entry.tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.getByToken(token)).thenResolve(entry);
            when(mockGameManager.get(tournament.gameId)).thenResolve(game);
            when(mockGameSessionManager.add(deepEqual(newSession))).thenResolve(gameSession);

            const controller = getController();

            // When
            const result = await controller.launch(token);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/redirect.html');
            expect(result.data).to.exist.with.property('url').that.equals(redirectUrl);
        });

        it('should create a game session and return HTML redirect page result when device type provided', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const deviceType = DeviceType.Mobile;
            const language = 'en';
            const sessionSecureId = '007460c4-f9a5-4f3c-a473-eda3f8cd20b0';

            const entry = generateTournamentEntry(1, 1);
            const tournament = generateTournament(1);
            const sessionRef =`TE:${entry.id}`;
            const game: Game = {
                id: 1,
                name: 'Game 1',
                provider: GameProvider.Revolver,
                thumbnail: 'https://an-image-url.com/image.jpg',
                orientation: GameOrientation.All,
                type: GameType.Slot,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const newSession: NewGameSession = {
                gameId: tournament.gameId,
                provider: game.provider,
                userId: entry.userId,
                reference: sessionRef,
                currencyCode: tournament.currencyCode,
                language,
                metadata: {
                    tournamentId: tournament.id,
                    entryId: entry.id
                }
            };

            const gameSession: GameSession = {
                id: 1,
                secureId: sessionSecureId,
                currencyCode: tournament.currencyCode,
                gameId: tournament.gameId,
                language,
                reference: sessionRef,
                metadata: {},
                provider: game.provider,
                userId: entry.userId,
                status: GameSessionStatus.Created,
                expireTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            };

            const redirectUrl = `https://api.test.com/game/play/${gameSession.secureId}?deviceType=${deviceType}`;

            when(mockTournamentManager.get(entry.tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.getByToken(token)).thenResolve(entry);
            when(mockGameManager.get(tournament.gameId)).thenResolve(game);
            when(mockGameSessionManager.add(deepEqual(newSession))).thenResolve(gameSession);

            const controller = getController();

            // When
            const result = await controller.launch(token, deviceType);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/redirect.html');
            expect(result.data).to.exist.with.property('url').that.equals(redirectUrl);
        });

        it('should reuse an existing session if one exists and is valid', async () => {
            // Given
            const token = 'rfj3094fj0ijdrv';
            const language = 'en';
            const sessionSecureId = '007460c4-f9a5-4f3c-a473-eda3f8cd20b0';

            const entry = generateTournamentEntry(1, 1);
            const tournament = generateTournament(1);
            const sessionRef =`TE:${entry.id}`;
            const game: Game = {
                id: 1,
                name: 'Game 1',
                provider: GameProvider.Revolver,
                thumbnail: 'https://an-image-url.com/image.jpg',
                orientation: GameOrientation.All,
                type: GameType.Slot,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const gameSession: GameSession = {
                id: 1,
                secureId: sessionSecureId,
                currencyCode: tournament.currencyCode,
                gameId: tournament.gameId,
                language,
                metadata: {},
                reference: sessionRef,
                provider: game.provider,
                userId: entry.userId,
                status: GameSessionStatus.Created,
                expireTime: new Date(),
                createTime: new Date(),
                updateTime: new Date()
            };

            const redirectUrl = `https://api.test.com/game/play/${gameSession.secureId}`;

            when(mockTournamentManager.get(entry.tournamentId)).thenResolve(tournament);
            when(mockTournamentEntryManager.getByToken(token)).thenResolve(entry);
            when(mockGameManager.get(tournament.gameId)).thenResolve(game);
            when(mockGameSessionManager.getByReference(sessionRef, deepEqual({
                currencyCode: tournament.currencyCode,
                statuses: [GameSessionStatus.Created],
                expired: false
            }))).thenResolve(gameSession);

            const controller = getController();

            // When
            const result = await controller.launch(token);

            // Then
            expect(result).to.exist;
            expect(result).to.be.instanceOf(HtmlResult);
            expect(result.filePath).to.endsWith('static/redirect.html');
            expect(result.data).to.exist.with.property('url').that.equals(redirectUrl);
        });
    });
});