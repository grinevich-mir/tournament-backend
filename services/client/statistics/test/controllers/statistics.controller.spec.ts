import { describe, it } from '@tcom/test';
import { mock, when, instance, mockUserRequest, reset, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { StatisticsController } from '../../src/controllers/statistics.controller';
import { StatisticsManager, StatisticsTop, TopWinnersType, StatisticsBigWins } from '@tcom/platform/lib/statistics';
import { User, UserManager, UserType } from '@tcom/platform/lib/user';
import { TopWinnerModel, BigWinsModel } from '../../src/models';
import { AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';

describe('StatisticsController', () => {
    const mockStatsManager = mock(StatisticsManager);
    const mockUserManager = mock(UserManager);
    const mockAvatarUrlResolver = mock(AvatarUrlResolver);

    function getController(): StatisticsController {
        return new StatisticsController(
            instance(mockStatsManager),
            instance(mockUserManager),
            instance(mockAvatarUrlResolver));
    }

    beforeEach(() => {
        reset(mockStatsManager);
        reset(mockUserManager);
        reset(mockAvatarUrlResolver);
    });

    describe('getLifetimeWinners()', () => {
        it('should return top lifetime winners', async () => {
            // Given
            const skip = 0;
            const take = 20;

            const topWinners: StatisticsTop[] = [{
                userId: 1,
                createTime: new Date(),
                currencyCode: 'USD',
                winnings: 100
            }];

            const models: TopWinnerModel[] = [{
                displayName: 'Anonymous',
                isPlayer: false,
                avatarUrl: undefined,
                country: 'US',
                rank: 1,
                winnings: 100
            }];

            when(mockStatsManager.getTopWinners(skip, take)).thenResolve(topWinners);
            when(mockAvatarUrlResolver.resolve(undefined as unknown as User)).thenReturn(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>();
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getLifetimeWinners();

            // Then
            expect(result).to.deep.equal(models);
        });

        context('user is logged in', () => {
            it('should return top lifetime winners', async () => {
                // Given
                const userId = 1;
                const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
                const skinId = 'tournament';
                const userType = UserType.Standard;
                const skip = 0;
                const take = 20;
                const user = {
                    id: 1,
                    displayName: 'Waffles'
                } as User;

                const topWinners: StatisticsTop[] = [{
                    userId: 1,
                    createTime: new Date(),
                    currencyCode: 'USD',
                    winnings: 100
                }];

                const models: TopWinnerModel[] = [{
                    displayName: 'Waffles',
                    isPlayer: true,
                    avatarUrl: 'https://avatar-url.com',
                    country: 'US',
                    rank: 1,
                    winnings: 100
                }];

                when(mockStatsManager.getTopWinners(skip, take)).thenResolve(topWinners);
                when(mockUserManager.get(topWinners[0].userId)).thenResolve(user);
                when(mockAvatarUrlResolver.resolve(user)).thenReturn('https://avatar-url.com');

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
                const result = await controller.getLifetimeWinners();

                // Then
                expect(result).to.deep.equal(models);
            });
        });
    });

    describe('get30DayWinners()', () => {
        it('should return top 30 day winners', async () => {
            // Given
            const skip = 0;
            const take = 20;

            const topWinners: StatisticsTop[] = [{
                userId: 1,
                createTime: new Date(),
                currencyCode: 'USD',
                winnings: 100
            }];

            const models: TopWinnerModel[] = [{
                displayName: 'Anonymous',
                isPlayer: false,
                avatarUrl: undefined,
                country: 'US',
                rank: 1,
                winnings: 100
            }];

            when(mockStatsManager.getTopWinners(skip, take, TopWinnersType.Last30Days)).thenResolve(topWinners);
            when(mockAvatarUrlResolver.resolve(undefined as unknown as User)).thenReturn(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>();
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get30DayWinners();

            // Then
            expect(result).to.deep.equal(models);
        });

        it('should return Big Wins', async () => {
            // Given
            const count = 5;

            const user = {
                id: 309,
                displayName: 'test_name'
            } as User;

            const bigWinners: StatisticsBigWins[] = [{
                userId: 309,
                name: 'tournament_name',
                id: '123',
                type: 'tournament',
                amount: 1000,
                date: new Date(),
            }];

            const models: BigWinsModel[] = [{
                amount: 1000,
                avatarUrl: 'https://avatar-url.com',
                country: 'US',
                displayName: 'test_name',
                isPlayer: false,
                name: 'tournament_name',
                type: 'tournament',
            }
        ];

            when(mockStatsManager.getBigWins(count)).thenResolve(bigWinners);
            when(mockUserManager.get(bigWinners[0].userId)).thenResolve(user);
            when(mockAvatarUrlResolver.resolve(user)).thenReturn('https://avatar-url.com');

            const controller = getController();

            const mockRequest = mockUserRequest<User>();
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getBigWins(count);

            // Then
            expect(result).to.deep.equal(models);
        });

        context('user is logged in', () => {
            it('should return top 30 day winners', async () => {
                // Given
                const userId = 1;
                const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
                const skinId = 'tournament';
                const userType = UserType.Standard;
                const skip = 0;
                const take = 20;
                const user = {
                    id: 1,
                    displayName: 'Waffles'
                } as User;

                const topWinners: StatisticsTop[] = [{
                    userId: 1,
                    createTime: new Date(),
                    currencyCode: 'USD',
                    winnings: 100
                }];

                const models: TopWinnerModel[] = [{
                    displayName: 'Waffles',
                    isPlayer: true,
                    avatarUrl: 'https://avatar-url.com',
                    country: 'US',
                    rank: 1,
                    winnings: 100
                }];

                when(mockStatsManager.getTopWinners(skip, take, TopWinnersType.Last30Days)).thenResolve(topWinners);
                when(mockUserManager.get(topWinners[0].userId)).thenResolve(user);
                when(mockAvatarUrlResolver.resolve(user)).thenReturn('https://avatar-url.com');

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
                const result = await controller.get30DayWinners();

                // Then
                expect(result).to.deep.equal(models);
            });
        });
    });
});