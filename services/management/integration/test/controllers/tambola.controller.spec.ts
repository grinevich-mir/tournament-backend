import { describe, it } from '@tcom/test';
import { mock, when, instance, reset, verify } from '@tcom/test/mock';
import { TambolaController } from '../../src/controllers/tambola.controller';
import { TambolaClient } from '@tcom/platform/lib/integration/tambola';

// TODO - confirm the type of data
const auditResponse: any[] = [{
    operatorId: '12345',
    gameId: 2,
    playerId: '6789',
    event: 'tournament',
    createTime: new Date(),
}];

const gameResponse: any[] = [{
    operatorId: 'abcd000-1111-efgh-3333-000011223344',
    gameId: 2,
    startTime: 1611072000000,
    prizeAmount: 600,
    currency: 'USD',
    participants: 10,
    minPlayers: 0,
    maxPlayers: 5000,
}];

describe('TambolaController', () => {
    const mockTambolaClient = mock(TambolaClient);

    function getController(): TambolaController {
        return new TambolaController(instance(mockTambolaClient));
    }

    beforeEach(() => reset(mockTambolaClient));

    describe('audits()', () => {
        it('should return all audit details for game', async () => {
            // Given
            when(mockTambolaClient.getAudits(2)).thenResolve(auditResponse);

            const controller = getController();

            // When
            const result = await controller.audits(2);
            console.log('audits() result ->', result);

            // Then
            verify(mockTambolaClient.getAudits(2)).once();
        });
    });

    describe('audit()', () => {
        it('should return all audit details for user', async () => {
            // Given
            when(mockTambolaClient.getAudit(2, '6789')).thenResolve(auditResponse);

            const controller = getController();

            // When
            const result = await controller.audit(2, '6789');
            console.log('audit() result ->', result);

            // Then
            verify(mockTambolaClient.getAudit(2, '6789')).once();
        });
    });

    describe('game()', () => {
        it('should return game details', async () => {
            // Given
            when(mockTambolaClient.getGame(2)).thenResolve(gameResponse[0]);

            const controller = getController();

            // When
            const result = await controller.game(2);
            console.log('game() result ->', result);

            // Then
            verify(mockTambolaClient.getGame(2)).once();
        });
    });

    describe('gameEntries()', () => {
        it('should return all game entry details', async () => {
            // Given
            when(mockTambolaClient.getGameEntries(2)).thenResolve(gameResponse);

            const controller = getController();

            // When
            const result = await controller.gameEntries(2);
            console.log('gameEntries() result ->', result);

            // Then
            verify(mockTambolaClient.getGameEntries(2)).once();
        });
    });

    describe('gameEntry()', () => {
        it('should return game details', async () => {
            // Given
            when(mockTambolaClient.getGameEntry(2, '6789')).thenResolve(gameResponse[0]);

            const controller = getController();

            // When
            const result = await controller.gameEntry(2, '6789');
            console.log('gameEntry() result ->', result);

            // Then
            verify(mockTambolaClient.getGameEntry(2, '6789')).once();
        });
     });
});