import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, verify, mockUserRequest, mockUser, anything } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { WinnerController } from '../../src/controllers/winner.controller';
import { TournamentWinnerManager, TournamentWinner } from '@tcom/platform/lib/tournament';
import { TournamentModelMapper, TournamentWinnerModel } from '@tcom/platform/lib/tournament/models';
import { User, UserManager, UserType } from '@tcom/platform/lib/user';
import { PrizeType } from '@tcom/platform/lib/prize';
import { StatisticsManager, StatisticsTotals } from '@tcom/platform/lib/statistics';

describe('WinnerController', () => {
    const mockTournamentWinnerManager = mock(TournamentWinnerManager);
    const mockStatisticsManager = mock(StatisticsManager);
    const mockMapper = mock(TournamentModelMapper);
    const mockUserManager = mock(UserManager);

    function getController(): WinnerController {
        return new WinnerController(
            instance(mockTournamentWinnerManager),
            instance(mockStatisticsManager),
            instance(mockUserManager),
            instance(mockMapper));
    }

    beforeEach(() => {
        reset(mockTournamentWinnerManager);
        reset(mockStatisticsManager);
        reset(mockMapper);
        reset(mockUserManager);
    });

    describe('getAll()', () => {
        it('should return an empty array if there are no winners', async () => {
            // Given
            const skinId = 'tournament';
            const count = 20;

            const winners: TournamentWinner[] = [];

            when(mockTournamentWinnerManager.getAll(skinId, count)).thenResolve(winners);

            const controller = getController();

            // When
            const result = await controller.getAll(skinId);

            // Then
            expect(result).to.be.empty;
        });

        it('should set count to 1 if zero or below and return winners', async () => {
            // Given
            const skinId = 'tournament';
            const count = -1;
            const actualCount = 1;

            const winner = mock<TournamentWinner>();
            const winnerModel = mock<TournamentWinnerModel>();

            when(mockTournamentWinnerManager.getAll(skinId, actualCount)).thenResolve([winner]);
            when(mockUserManager.get(anything())).thenResolve(undefined);
            when(mockMapper.mapWinner(winner, undefined)).thenReturn(winnerModel);

            const controller = getController();

            // When
            const result = await controller.getAll(skinId, count);

            // Then
            expect(result[0]).to.equal(winnerModel);
            verify(mockTournamentWinnerManager.getAll(skinId, actualCount)).once();
        });

        it('should set count to 30 if more than 30 and return winners', async () => {
            // Given
            const skinId = 'tournament';
            const count = 100;
            const actualCount = 30;

            const winner = mock<TournamentWinner>();
            const winnerModel = mock<TournamentWinnerModel>();

            when(mockTournamentWinnerManager.getAll(skinId, actualCount)).thenResolve([winner]);
            when(mockUserManager.get(anything())).thenResolve(undefined);
            when(mockMapper.mapWinner(winner, undefined)).thenReturn(winnerModel);

            const controller = getController();

            // When
            const result = await controller.getAll(skinId, count);

            // Then
            expect(result[0]).to.equal(winnerModel);
            verify(mockTournamentWinnerManager.getAll(skinId, actualCount)).once();
        });

        context('user is logged in', () => {
            it('should set isPlayer to false flag on winner if user is logged in and is not a winner', async () => {
                // Given
                const userId = 1;
                const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
                const skinId = 'tournament';
                const userType = UserType.Standard;
                const count = 100;
                const actualCount = 30;

                const winner = mock<TournamentWinner>();
                const winnerModel: TournamentWinnerModel = {
                    id: '1234',
                    country: 'US',
                    date: new Date(),
                    displayName: 'Blah',
                    prize: {
                        type: PrizeType.Cash,
                        amount: 100,
                        currencyCode: 'USD'
                    },
                    tournamentName: 'Tournament 1',
                    tournamentId: 1,
                    tournamentType: 'Slot',
                    isPlayer: false
                };

                when(mockTournamentWinnerManager.getAll(skinId, actualCount)).thenResolve([winner]);
                when(mockUserManager.get(anything())).thenResolve(undefined);
                when(mockMapper.mapWinner(winner, undefined)).thenReturn(winnerModel);

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
                const result = await controller.getAll(skinId, count);

                // Then
                expect(result[0]).to.equal(winnerModel);
                expect(result[0].isPlayer).to.be.false;
                verify(mockTournamentWinnerManager.getAll(skinId, actualCount)).once();
            });

            it('should set isPlayer to true flag on winner if user is logged in and is a winner', async () => {
                // Given
                const userId = 1;
                const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
                const skinId = 'tournament';
                const userType = UserType.Standard;
                const count = 100;
                const actualCount = 30;

                const user = {
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                } as User;

                const winner = mock<TournamentWinner>();
                winner.userId = 1;
                const winnerModel: TournamentWinnerModel = {
                    id: '1234',
                    country: 'US',
                    date: new Date(),
                    displayName: 'Blah',
                    prize: {
                        type: PrizeType.Cash,
                        amount: 100,
                        currencyCode: 'USD'
                    },
                    tournamentName: 'Tournament 1',
                    tournamentId: 1,
                    tournamentType: 'Slot',
                    isPlayer: false
                };

                when(mockTournamentWinnerManager.getAll(skinId, actualCount)).thenResolve([winner]);
                when(mockUserManager.get(userId)).thenResolve(user);
                when(mockMapper.mapWinner(winner, user)).thenReturn(winnerModel);

                const controller = getController();

                const mockRequest = mockUserRequest<User>({
                    user: mockUser(user)
                });
                controller.setRequest(instance(mockRequest));

                // When
                const result = await controller.getAll(skinId, count);

                // Then
                expect(result[0]).to.equal(winnerModel);
                expect(result[0].isPlayer).to.be.true;
                verify(mockTournamentWinnerManager.getAll(skinId, actualCount)).once();
            });
        });
    });

    describe('getTotals()', () => {
        it('should return totals', async () => {
            // Given
            const totals: StatisticsTotals = {
                completedWithdrawals: 0,
                liability: 0,
                pendingWithdrawals: 0,
                potentialLiability: 0,
                totalSignUps: 0,
                winnings: 123.58,
                createTime: new Date()
            };
            when(mockStatisticsManager.getTotals()).thenResolve(totals);

            const controller = getController();

            // When
            const result = await controller.getTotals();

            // Then
            expect(result.amount).to.equal(123.58);
        });
    });
});