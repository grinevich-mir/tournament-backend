import { describe, it } from '@tcom/test';
import { mock, when, deepEqual, instance, reset } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { GameController } from '../../src/controllers/game.controller';
import { GameManager, GameFilter, Game, GameProvider, GameType, GameOrientation } from '@tcom/platform/lib/game';
import { PagedResult } from '@tcom/platform/lib/core';
import { GameModelMapper, GameModel } from '@tcom/platform/lib/game/models';

describe('GameController', () => {
    const mockManager = mock(GameManager);
    const mockMapper = mock(GameModelMapper);

    function getController(): GameController {
        return new GameController(
            instance(mockManager),
            instance(mockMapper));
    }

    beforeEach(() => {
        reset(mockManager);
        reset(mockMapper);
    });

    describe('getAll()', () => {
        it('should return a list of games', async () => {
            // Given
            const filter: GameFilter = {
                page: 1,
                pageSize: 20
            };

            const games: Game[] = [
                {
                    id: 1,
                    name: 'Game 1',
                    thumbnail: 'a-thumbnail.jpg',
                    type: GameType.Slot,
                    provider: GameProvider.Revolver,
                    orientation: GameOrientation.All,
                    enabled: true,
                    createTime: new Date(),
                    updateTime: new Date()
                }
            ];

            const gamesResult = new PagedResult(games, 1, 1, 20);

            const models: GameModel[] = [
                {
                    id: 1,
                    name: 'Game 1',
                    provider: GameProvider[GameProvider.Revolver],
                    thumbnail: 'a-thumbnail.jpg',
                    orientation: GameOrientation.All,
                    type: GameType[GameType.Slot]
                }
            ];

            when(mockManager.getAll(deepEqual(filter))).thenResolve(gamesResult);
            when(mockMapper.map(games[0])).thenReturn(models[0]);

            const controller = getController();

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.exist;
            expect(result.page).to.equal(1);
            expect(result.pageSize).to.equal(20);
            expect(result.totalCount).to.equal(1);
            expect(result.items[0]).to.equal(models[0]);
        });
    });
});