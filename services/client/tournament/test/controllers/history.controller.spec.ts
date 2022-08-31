import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, deepEqual, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { HistoryController } from '../../src/controllers/history.controller';
import { TournamentManager, TournamentEntryManager, TournamentFilter, TournamentState, UserTournament } from '@tcom/platform/lib/tournament';
import { TournamentModelMapper, UserTournamentModel } from '@tcom/platform/lib/tournament/models';
import { generateTournamentModels, generateTournament, generateTournamentModel, generateTournamentEntry, generateTournamentEntryModel, generatePagedTournaments } from '../helpers';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { User, UserType } from '@tcom/platform/lib/user';

describe('HistoryController', () => {
    const mockTournamentManager = mock(TournamentManager);
    const mockTournamentEntryManager = mock(TournamentEntryManager);
    const mockMapper = mock(TournamentModelMapper);

    function getController(): HistoryController {
        return new HistoryController(
            instance(mockTournamentManager),
            instance(mockTournamentEntryManager),
            instance(mockMapper));
    }

    beforeEach(() => {
        reset(mockTournamentManager);
        reset(mockTournamentEntryManager);
        reset(mockMapper);
    });

    describe('getAllForUser()', () => {
        it('should return tournaments', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const page = 1;
            const pageSize = 20;

            const tournaments = generatePagedTournaments(10, page, pageSize) as PagedResult<UserTournament>;
            const tournamentModels = generateTournamentModels(10) as UserTournamentModel[];

            const filter: TournamentFilter = {
                page,
                pageSize,
                enabled: true,
                states: [TournamentState.Ended, TournamentState.Cancelled],
                order: {
                    startTime: 'DESC'
                }
            };

            when(mockTournamentManager.getAllForUser(userId, deepEqual(filter))).thenResolve(tournaments);
            when(mockMapper.mapAllForUser(tournaments.items)).thenResolve(tournamentModels);

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
            const result = await controller.getAllForUser();

            // Then
            expect(result.items).to.equal(tournamentModels);
        });

        it('should limit take and return tournaments', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const page = 0;
            const pageSize = 30;
            const actualPageSize = 20;

            const tournaments = generatePagedTournaments(10, page, pageSize) as PagedResult<UserTournament>;
            const tournamentModels = generateTournamentModels(10) as UserTournamentModel[];

            const filter: TournamentFilter = {
                page,
                pageSize: actualPageSize,
                enabled: true,
                states: [TournamentState.Ended, TournamentState.Cancelled],
                order: {
                    startTime: 'DESC'
                }
            };

            when(mockTournamentManager.getAllForUser(userId, deepEqual(filter))).thenResolve(tournaments);
            when(mockMapper.mapAllForUser(tournaments.items)).thenResolve(tournamentModels);

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
            const result = await controller.getAllForUser(page, pageSize);

            // Then
            expect(result.items).to.equal(tournamentModels);
        });
    });

    describe('get()', () => {
        it('should throw a not found error when the tournament does not exist', async () => {
            // Given
            const tournamentId = 1;

            when(mockTournamentManager.get(tournamentId)).thenResolve(undefined);

            const controller = getController();

            // When
            const delegate = async () => controller.get(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Tournament not found');
        });

        it('should return the tournament', async () => {
            // Given
            const tournamentId = 1;

            const tournament = generateTournament(tournamentId);
            const tournamentModel = generateTournamentModel(tournamentId);

            when(mockTournamentManager.get(tournamentId)).thenResolve(tournament);
            when(mockMapper.map(tournament)).thenResolve(tournamentModel);

            const controller = getController();

            // When
            const result = await controller.get(tournamentId);

            // Then
            expect(result).to.equal(tournamentModel);
        });
    });

    describe('getUserEntry()', () => {
        it('should throw a not found error when the entry does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tournamentId = 1;

            when(mockTournamentEntryManager.get(tournamentId, userId)).thenResolve(undefined);

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
            const delegate = async () => controller.getUserEntry(tournamentId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Entry not found');
        });

        it('should return the entry', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const tournamentId = 1;

            const entry = generateTournamentEntry(1, 1);
            const entryModel = generateTournamentEntryModel(1, 1);

            when(mockTournamentEntryManager.get(tournamentId, userId)).thenResolve(entry);
            when(mockMapper.mapEntry(entry)).thenReturn(entryModel);

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
            const result = await controller.getUserEntry(tournamentId);

            // Then
            expect(result).to.equal(entryModel);
        });
    });
});