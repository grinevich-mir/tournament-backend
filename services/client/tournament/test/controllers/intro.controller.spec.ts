import { describe, it } from '@tcom/test';
import { mock, instance, verify, reset, when, mockUserRequest, anything } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { BadRequestError, NotFoundError } from '@tcom/platform/lib/core';
import { User } from '@tcom/platform/lib/user';
import { TournamentManager, TournamentIntroManager, TournamentIntro, TournamentEntryManager } from '@tcom/platform/lib/tournament';
import { TournamentIntroCompiler } from '@tcom/platform/lib/tournament/utilities';
import { TournamentIntroModel, TournamentModelMapper } from '@tcom/platform/lib/tournament/models';
import { IntroController } from '../../src/controllers/intro.controller';
import { generateTournament, generateTournamentEntry, generateUserTournamentModel } from '../helpers';

describe('IntroController', () => {
    const mockTournamentManager = mock(TournamentManager);
    const mockTournamentModelMapper = mock(TournamentModelMapper);
    const mockTournamentEntryManager = mock(TournamentEntryManager);
    const mockTournamentIntroManager = mock(TournamentIntroManager);
    const mockTournamentIntroCompiler = mock(TournamentIntroCompiler);

    function getController(): IntroController {
        return new IntroController(
            instance(mockTournamentManager),
            instance(mockTournamentModelMapper),
            instance(mockTournamentEntryManager),
            instance(mockTournamentIntroManager),
            instance(mockTournamentIntroCompiler));
    }

    beforeEach(() => {
        reset(mockTournamentManager);
        reset(mockTournamentIntroManager);
        reset(mockTournamentIntroCompiler);
    });

    describe('getByTournamentId()', () => {
        it('should throw a not found error when the tournament does not exist', async () => {
            // Given
            const tournamentId = 1;
            when(mockTournamentManager.get(tournamentId)).thenResolve(undefined);

            const controller = getController();

            // When
            const delegate = async () => controller.getByTournamentId(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Tournament not found');
        });

        it('should throw a bad request error when tournament introId is undefined', async () => {
            // Given
            const tournamentId = 1;
            const tournament = generateTournament(tournamentId);
            tournament.introId = undefined;

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);

            const controller = getController();

            // When
            const delegate = async () => controller.getByTournamentId(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(BadRequestError, 'Missing tournament intro ID');
        });

        it('should return tournament intro', async () => {
            // Given
            const user: User = { id: 1 } as User;
            const tournamentId = 1;
            const tournamentIntroId = 1;
            const tournament = generateTournament(tournamentId);
            const tournamentEntry = generateTournamentEntry(tournamentId, user.id);
            const userTournament = generateUserTournamentModel(tournamentId);

            const tournamentIntro: TournamentIntro = {
                id: 1,
                name: 'Test',
                topContent: 'This is the top content',
                bottomContent: 'This is the bottom content',
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const tournamentIntroModel: TournamentIntroModel = {
                topContent: 'This is the top content',
                bottomContent: 'This is the bottom content'
            };

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockTournamentIntroManager.getActive(tournamentIntroId)).thenResolve(tournamentIntro);
            when(mockTournamentEntryManager.get(tournamentId, user.id)).thenResolve(tournamentEntry);
            when(mockTournamentModelMapper.mapForUser(tournament)).thenResolve(userTournament);
            when(mockTournamentModelMapper.mapAllocationInfo(userTournament));
            when(mockTournamentIntroCompiler.compile(tournamentIntro, anything())).thenReturn(tournamentIntroModel);

            const controller = getController();
            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getByTournamentId(tournamentId);

            // Then
            expect(result).to.equal(tournamentIntroModel);
            verify(mockTournamentManager.get(tournamentId)).once();
            verify(mockTournamentEntryManager.get(tournamentId, user.id)).once();
            verify(mockTournamentModelMapper.mapForUser(tournament)).once();
            verify(mockTournamentIntroManager.getActive(tournamentIntroId)).once();
            verify(mockTournamentIntroCompiler.compile(tournamentIntro, anything())).once();
        });
    });
});