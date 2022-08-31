import { describe, it } from '@tcom/test';
import { mock, when, instance, reset, verify } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { HiloController } from '../../src/controllers/hilo.controller';
import { AuditResponse, GameDirection, GameEntryResponse, GameResponse, GameState, GameTier, HiloClient } from '@tcom/platform/lib/integration/hilo';

const auditResponse: AuditResponse[] = [{
    operatorId: '12345',
    gameId: 1,
    playerId: '6789',
    event: 'tournament',
    createTime: new Date(),
}];

const gameEntryResponse: GameEntryResponse[] = [{
    playerId: '6789',
    playerNickname: 'Test NickName',
    operatorId: 'abcd000-1111-efgh-3333-000011223344',
    gameId: 2,
    moves: [GameDirection.HIGHER],
    knockedOut: false,
    token: 'k32tk-89044-ds989-098tg',
    sessionToken: 'ds989-098tg-k32tk-89044',
    prizeAmount: 100,
    createTime: new Date(),
}];

describe('HiloController', () => {
    const mockHiloClient = mock(HiloClient);

    function getController(): HiloController {
        return new HiloController(instance(mockHiloClient));
    }

    beforeEach(() => reset(mockHiloClient));

    describe('audits()', () => {
        it('should return all audit details for game', async () => {
            // Given
            when(mockHiloClient.getAudits(1)).thenResolve(auditResponse);

            const controller = getController();

            // When
            const result = await controller.audits(1);

            // Then
            expect(result[0].gameId).to.equal(1);
            verify(mockHiloClient.getAudits(1)).once();
        });
    });

    describe('audit()', () => {
        it('should return audit details for user', async () => {
            // Given
            when(mockHiloClient.getAudit(1, '6789')).thenResolve(auditResponse);

            const controller = getController();

            // When
            const result = await controller.audit(1, '6789');

            // Then
            expect(result[0].gameId).to.equal(1);
            expect(result[0].playerId).to.equal('6789');
            verify(mockHiloClient.getAudit(1, '6789')).once();
        });
    });

    describe('game()', () => {
        const gameResponse: GameResponse = {
            operatorId: 'abcd000-1111-efgh-3333-000011223344',
            gameId: 2,
            startTime: 1611072000000,
            prizeAmount: 600,
            currency: 'USD',
            participants: 10,
            minPlayers: 0,
            maxPlayers: 5000,
            roundDurationSeconds: 30,
            cutOffTime: 5,
            numbers: [6, 21, 18, 10],
            state: GameState.Ended,
            tier: GameTier.FREE,
            enabled: true,
            remainingPlayerCount: 0,
            name: 'Hi-Lo',
            roundNumber: 5,
            numUpPlayers: 10,
            numDownPlayers: 5,
            maxWinners: 1,
            maxRounds: 10,
        };

        it('should return game details', async () => {
            // Given
            when(mockHiloClient.getGame(2)).thenResolve(gameResponse);

            const controller = getController();

            // When
            const result = await controller.game(2);

            // Then
            expect(result.gameId).to.equal(2);
            expect(result.state).to.equal(6);
            expect(result.tier).to.equal(0);
            verify(mockHiloClient.getGame(2)).once();
        });
    });

    describe('gameEntries()', () => {
        it('should return all game entry details', async () => {
            // Given
            when(mockHiloClient.getGameEntries(2)).thenResolve(gameEntryResponse);

            const controller = getController();

            // When
            const result = await controller.gameEntries(2);

            // Then
            expect(result[0].playerNickname).to.equal('Test NickName');
            expect(result[0].moves).to.contain(1);
            verify(mockHiloClient.getGameEntries(2)).once();
        });
    });

    describe('gameEntriesAsCSV()', () => {
        it('should return al game entries in CSV', async () => {
            // Given
            when(mockHiloClient.getGameEntries(2)).thenResolve(gameEntryResponse);

            const controller = getController();

            // When
            const result = await controller.gameEntriesAsCSV(2);

            // Then
            expect(result).to.be.a('string');
            verify(mockHiloClient.getGameEntries(2)).once();
        });
    });

    describe('gameEntry()', () => {
        it('should return game entry details', async () => {
            // Given
            when(mockHiloClient.getGameEntry(2, '6789')).thenResolve(gameEntryResponse[0]);

            const controller = getController();

            // When
            const result = await controller.gameEntry(2, '6789');

            // Then
            expect(result).to.equal(gameEntryResponse[0]);
            verify(mockHiloClient.getGameEntry(2, '6789')).once();
        });
    });
});