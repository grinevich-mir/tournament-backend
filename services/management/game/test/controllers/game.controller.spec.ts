import { describe, it } from '@tcom/test';
import { mock, when, instance, reset, verify, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { GameController } from '../../src/controllers/game.controller';
import { Game, GameFilter, GameManager, GameOrientation, GameProvider, GameType } from '@tcom/platform/lib/game';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';

const game: Game[] = [{
    id: 1,
    name: 'Hi-Lo',
    type: GameType.Hilo,
    provider: GameProvider.Hilo,
    thumbnail: 'https://content.tournament.dev.tgaming.io/banners/21.png',
    orientation: GameOrientation.Portrait,
    enabled: true,
    createTime: new Date(),
    updateTime: new Date(),
}];

describe('GameController', () => {
    const mockGameManager = mock(GameManager);

    function getController(): GameController {
        return new GameController(instance(mockGameManager));
    }

    beforeEach(() => reset(mockGameManager));

    describe('getAll()', () => {
        const filter: GameFilter = {
            page: 1,
            pageSize: 20,
        };

        it('should return all games', async () => {
            // Given
            when(mockGameManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(game, 10, 1, 20));

            const controller = getController();

            // When
            const result = await controller.getAll();

            // Then
            expect(result.items[0].type).to.equal(2);
            verify(mockGameManager.getAll(deepEqual(filter))).once();
        });
    });

    describe('get()', () => {
        it('should return a game by ID', async () => {
            // Given
            when(mockGameManager.get(10)).thenResolve(game[0]);

            const controller = getController();

            // When
            const result = await controller.get(10);

            // Then
            expect(result.name).to.equal('Hi-Lo');
            expect(result.type).to.equal(2);
            expect(result.provider).to.equal(1);
            verify(mockGameManager.get(10)).once();
        });

        it('should throw a not found error if no game by ID is found', async () => {
            // Given
            when(mockGameManager.get(10)).thenResolve();

            const controller = getController();

            // When
            const delegate = async () => controller.get(10);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Game not found.');
        });
    });
});