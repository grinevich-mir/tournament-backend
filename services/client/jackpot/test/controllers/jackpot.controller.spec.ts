import { describe, it } from '@tcom/test';
import { mock, instance, reset, when, verify, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { JackpotController } from '../../src/controllers/jackpot.controller';
import { JackpotWinnerManager, JackpotWinner } from '@tcom/platform/lib/jackpot';
import { JackpotWinnerModel } from '../../src/models';
import { User, UserManager } from '@tcom/platform/lib/user';
import { AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';

describe('JackpotController', () => {
    const mockJackpotWinnerManager = mock(JackpotWinnerManager);
    const mockUserManager = mock(UserManager);
    const mockAvatarUrlResolver = mock(AvatarUrlResolver);

    function getController(): JackpotController {
        return new JackpotController(
            instance(mockJackpotWinnerManager),
            instance(mockUserManager),
            instance(mockAvatarUrlResolver));
    }

    beforeEach(() => {
        reset(mockJackpotWinnerManager);
        reset(mockUserManager);
        reset(mockAvatarUrlResolver);
    });

    describe('getWinners()', () => {
        it('should return an empty array if there are no winners', async () => {
            // Given
            const count = 20;
            const winners: JackpotWinner[] = [];

            when(mockJackpotWinnerManager.getAll(count)).thenResolve(winners);

            const controller = getController();

            // When
            const result = await controller.getWinners(count);

            // Then
            expect(result).to.be.empty;
        });

        it('should exclude winner if user record is not found', async () => {
            // Given
            const count = 20;

            const winner: JackpotWinner = {
                id: '1234',
                jackpotId: 1,
                jackpotName: 'Jackpot 1',
                jackpotLabel: 'Jackpot Label',
                amount: 100,
                date: new Date(),
                userId: 1
            };

            when(mockJackpotWinnerManager.getAll(count)).thenResolve([winner]);
            when(mockUserManager.get(winner.userId)).thenResolve(undefined);

            const controller = getController();

            // When
            const result = await controller.getWinners(count);

            // Then
            expect(result).to.be.empty;
        });

        it('should attempt to find 20 winners if count parameter is not supplied', async () => {
            // Given
            const count = 20;
            const winners: JackpotWinner[] = [];

            when(mockJackpotWinnerManager.getAll(count)).thenResolve(winners);

            const controller = getController();

            // When
            await controller.getWinners();

            // Then
            verify(mockJackpotWinnerManager.getAll(count)).once();
        });

        it('should set count to 1 if zero or below and return winners', async () => {
            // Given
            const count = -1;
            const actualCount = 1;

            const userId = 1;
            const userCountry = 'US';
            const userDisplayName = 'User 1';
            const user = {
                id: userId,
                country: userCountry,
                displayName: userDisplayName
            } as User;

            const winner: JackpotWinner = {
                id: '1234',
                jackpotId: 1,
                jackpotName: 'Jackpot 1',
                jackpotLabel: 'Jackpot Label',
                amount: 100,
                date: new Date(),
                userId
            };

            const winnerModel: JackpotWinnerModel = {
                id: winner.id,
                jackpotId: winner.jackpotId,
                jackpotName: winner.jackpotName,
                jackpotLabel: winner.jackpotLabel,
                amount: winner.amount,
                date: winner.date,
                country: userCountry,
                displayName: userDisplayName,
                isPlayer: false,
                avatarUrl: undefined
            };

            when(mockJackpotWinnerManager.getAll(actualCount)).thenResolve([winner]);
            when(mockUserManager.get(winner.userId)).thenResolve(user);
            when(mockAvatarUrlResolver.resolve(user)).thenReturn(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>();
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getWinners(count);

            // Then
            expect(result[0]).to.deep.equal(winnerModel);
            verify(mockJackpotWinnerManager.getAll(actualCount)).once();
        });

        it('should set count to 30 if more than 30 and return winners', async () => {
            // Given
            const count = 100;
            const actualCount = 30;

            const userId = 1;
            const userCountry = 'US';
            const userDisplayName = 'User 1';
            const user = {
                id: userId,
                country: userCountry,
                displayName: userDisplayName
            } as User;

            const winner: JackpotWinner = {
                id: '1234',
                jackpotId: 1,
                jackpotName: 'Jackpot 1',
                jackpotLabel: 'Jackpot Label',
                amount: 100,
                date: new Date(),
                userId
            };

            const winnerModel: JackpotWinnerModel = {
                id: winner.id,
                jackpotId: winner.jackpotId,
                jackpotName: winner.jackpotName,
                jackpotLabel: winner.jackpotLabel,
                amount: winner.amount,
                date: winner.date,
                country: userCountry,
                displayName: userDisplayName,
                isPlayer: false,
                avatarUrl: undefined
            };

            when(mockJackpotWinnerManager.getAll(actualCount)).thenResolve([winner]);
            when(mockUserManager.get(winner.userId)).thenResolve(user);
            when(mockAvatarUrlResolver.resolve(user)).thenReturn(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>();
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getWinners(count);

            // Then
            expect(result[0]).to.deep.equal(winnerModel);
            verify(mockJackpotWinnerManager.getAll(actualCount)).once();
        });

        context('user is logged in', () => {
            it('should set isPlayer flag to true if the logged in user is the winner', async () => {
                // Given
                const count = 20;

                const userId = 1;
                const userCountry = 'US';
                const userDisplayName = 'User 1';
                const user = {
                    id: userId,
                    country: userCountry,
                    displayName: userDisplayName
                } as User;

                const winner: JackpotWinner = {
                    id: '1234',
                    jackpotId: 1,
                    jackpotName: 'Jackpot 1',
                    jackpotLabel: 'Jackpot Label',
                    amount: 100,
                    date: new Date(),
                    userId
                };

                const winnerModel: JackpotWinnerModel = {
                    id: winner.id,
                    jackpotId: winner.jackpotId,
                    jackpotName: winner.jackpotName,
                    jackpotLabel: winner.jackpotLabel,
                    amount: winner.amount,
                    date: winner.date,
                    country: userCountry,
                    displayName: userDisplayName,
                    isPlayer: true,
                    avatarUrl: undefined
                };

                when(mockJackpotWinnerManager.getAll(count)).thenResolve([winner]);
                when(mockUserManager.get(winner.userId)).thenResolve(user);
                when(mockAvatarUrlResolver.resolve(user)).thenReturn(undefined);

                const controller = getController();

                const mockRequest = mockUserRequest<User>({
                    user: mockUser(user)
                });

                controller.setRequest(instance(mockRequest));

                // When
                const result = await controller.getWinners(count);

                // Then
                expect(result[0]).to.deep.equal(winnerModel);
                verify(mockJackpotWinnerManager.getAll(count)).once();
            });

            it('should set the winner display name as anonymous if the field is missing on the user', async () => {
                // Given
                const count = 20;

                const userId = 1;
                const userCountry = 'US';
                const user = {
                    id: userId,
                    country: userCountry,
                    displayName: ''
                } as User;

                const winner: JackpotWinner = {
                    id: '1234',
                    jackpotId: 1,
                    jackpotName: 'Jackpot 1',
                    jackpotLabel: 'Jackpot Label',
                    amount: 100,
                    date: new Date(),
                    userId
                };

                const winnerModel: JackpotWinnerModel = {
                    id: winner.id,
                    jackpotId: winner.jackpotId,
                    jackpotName: winner.jackpotName,
                    jackpotLabel: winner.jackpotLabel,
                    amount: winner.amount,
                    date: winner.date,
                    country: userCountry,
                    displayName: 'Anonymous',
                    isPlayer: true,
                    avatarUrl: undefined
                };

                when(mockJackpotWinnerManager.getAll(count)).thenResolve([winner]);
                when(mockUserManager.get(winner.userId)).thenResolve(user);
                when(mockAvatarUrlResolver.resolve(user)).thenReturn(undefined);

                const controller = getController();

                const mockRequest = mockUserRequest<User>({
                    user: mockUser(user)
                });

                controller.setRequest(instance(mockRequest));

                // When
                const result = await controller.getWinners(count);

                // Then
                expect(result[0]).to.deep.equal(winnerModel);
                verify(mockJackpotWinnerManager.getAll(count)).once();
            });

            it('should set the winner country as US if the field is missing on the user', async () => {
                // Given
                const count = 20;

                const userId = 1;
                const userDisplayName = 'User 1';
                const user = {
                    id: userId,
                    country: '',
                    displayName: userDisplayName
                } as User;

                const winner: JackpotWinner = {
                    id: '1234',
                    jackpotId: 1,
                    jackpotName: 'Jackpot 1',
                    jackpotLabel: 'Jackpot Label',
                    amount: 100,
                    date: new Date(),
                    userId
                };

                const winnerModel: JackpotWinnerModel = {
                    id: winner.id,
                    jackpotId: winner.jackpotId,
                    jackpotName: winner.jackpotName,
                    jackpotLabel: winner.jackpotLabel,
                    amount: winner.amount,
                    date: winner.date,
                    country: 'US',
                    displayName: userDisplayName,
                    isPlayer: true,
                    avatarUrl: undefined
                };

                when(mockJackpotWinnerManager.getAll(count)).thenResolve([winner]);
                when(mockUserManager.get(winner.userId)).thenResolve(user);
                when(mockAvatarUrlResolver.resolve(user)).thenReturn(undefined);

                const controller = getController();

                const mockRequest = mockUserRequest<User>({
                    user: mockUser(user)
                });

                controller.setRequest(instance(mockRequest));

                // When
                const result = await controller.getWinners(count);

                // Then
                expect(result[0]).to.deep.equal(winnerModel);
                verify(mockJackpotWinnerManager.getAll(count)).once();
            });
        });
    });
});