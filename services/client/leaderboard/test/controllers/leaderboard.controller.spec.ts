import { describe, it, context, beforeEach } from '@tcom/test';
import { mock, when, instance, reset, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { LeaderboardManager, LeaderboardProgressManager, Leaderboard, LeaderboardType, LeaderboardEntry, LeaderboardProgress } from '@tcom/platform/lib/leaderboard';
import { LeaderboardController } from '../../src/controllers/leaderboard.controller';
import { LeaderboardModelMapper, LeaderboardModel, LeaderboardEntryModel } from '@tcom/platform/lib/leaderboard/models';
import { NotFoundError } from '@tcom/platform/lib/core';
import { User, UserType } from '@tcom/platform/lib/user';

describe('LeaderboardController', () => {
    const leaderboardId = 1;
    const skip = 0;
    const take = 20;
    const leaderboard: Leaderboard = {
        id: leaderboardId,
        type: LeaderboardType.Global,
        entryCount: 1,
        entries: [],
        createTime: new Date(),
        finalised: false,
        prizes: []
    };

    const leaderboardModel: LeaderboardModel = {
        entryCount: 1,
        id: leaderboardId,
        prizes: [],
        type: LeaderboardType.Global,
        entries: []
    };

    const mockLeaderboardManager = mock(LeaderboardManager);
    const mockProgressManager = mock(LeaderboardProgressManager);
    const mockMapper = mock(LeaderboardModelMapper);

    function getController(): LeaderboardController {
        return new LeaderboardController(
            instance(mockLeaderboardManager),
            instance(mockProgressManager),
            instance(mockMapper));

    }

    beforeEach(() => {
        reset(mockLeaderboardManager);
        reset(mockProgressManager);
        reset(mockMapper);
    });

    describe('get()', () => {
        it('should throw leaderboard not found error when it does not exist', async () => {
            // Given
            when(mockLeaderboardManager.get(leaderboardId, skip, take, undefined)).thenResolve(undefined);

            const controller = getController();

            // When
            const delegate = async () => controller.get(leaderboardId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Leaderboard not found');
        });

        it('should return the leaderboard', async () => {
            // Given
            when(mockLeaderboardManager.get(leaderboardId, skip, take, undefined)).thenResolve(leaderboard);
            when(mockMapper.map(leaderboard, undefined)).thenReturn(leaderboardModel);

            const controller = getController();
            // When
            const result = await controller.get(leaderboardId);

            // Then
            expect(result).equal(leaderboardModel);
        });

        context('user is logged in', () => {
            it('should return the leaderboard', async () => {
                // Given
                const userId = 1;
                const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
                const skinId = 'tournament';
                const userType = UserType.Standard;

                when(mockLeaderboardManager.get(leaderboardId, skip, take, userId)).thenResolve(leaderboard);
                when(mockMapper.map(leaderboard, userId)).thenReturn(leaderboardModel);

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
                const result = await controller.get(leaderboardId);

                // Then
                expect(result).equal(leaderboardModel);
            });
        });
    });

    describe('getAroundMe()', () => {
        it('should throw leaderboard not found error when it does not exist', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const count = 3;
            const topTake = count * 2 + 1;

            when(mockLeaderboardManager.getAroundUser(leaderboardId, userId, count)).thenResolve(undefined);
            when(mockLeaderboardManager.get(leaderboardId, 0, topTake)).thenResolve(undefined);

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
            const delegate = async () => controller.getAroundMe(leaderboardId, count);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Leaderboard not found');
        });

        it('should return the top entries when the user is not in the leaderboard', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const count = 3;
            const topTake = count * 2 + 1;

            when(mockLeaderboardManager.getAroundUser(leaderboardId, userId, count)).thenResolve(undefined);
            when(mockLeaderboardManager.get(leaderboardId, 0, topTake)).thenResolve(leaderboard);
            when(mockMapper.map(leaderboard, userId)).thenReturn(leaderboardModel);

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
            const result = await controller.getAroundMe(leaderboardId, count);

            // Then
            expect(result).equal(leaderboardModel);
        });

        it('should return the leaderboard around the user', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockLeaderboardManager.getAroundUser(leaderboardId, userId, 3)).thenResolve(leaderboard);
            when(mockMapper.map(leaderboard, userId)).thenReturn(leaderboardModel);

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
            const result = await controller.getAroundMe(leaderboardId);

            // Then
            expect(result).equal(leaderboardModel);
        });
    });

    describe('getMe()', () => {
        it('should throw not found error when user is not in leaderboard', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockLeaderboardManager.getEntry(leaderboardId, userId)).thenResolve(undefined);

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
            const delegate = async () => controller.getMe(leaderboardId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'User does not exist in this leaderboard');
        });

        it('should return entry', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const entry: LeaderboardEntry = {
                userId,
                displayName: 'User1',
                country: 'US',
                points: 1,
                tieBreaker: 1,
                runningPoints: 1,
                runningTieBreaker: 1,
                rank: 1
            };

            const entryModel: LeaderboardEntryModel = {
                displayName: 'User1',
                country: 'US',
                isPlayer: true,
                points: 1,
                runningPoints: 1,
                rank: 1
            };

            when(mockLeaderboardManager.getEntry(leaderboardId, userId)).thenResolve(entry);
            when(mockMapper.mapEntry(entry, userId)).thenReturn(entryModel);

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
            const result = await controller.getMe(leaderboardId);

            // Then
            expect(result).to.equal(entryModel);
        });
    });

    describe('getProgress()', () => {
        it('should return progress', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const progress: LeaderboardProgress[] = [{
                event: 'Event',
                count: 1,
                milestones: []
            }];

            when(mockProgressManager.get(leaderboardId, userId)).thenResolve(progress);

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
            const result = await controller.getProgress(leaderboardId);

            // Then
            expect(result).equals(progress);
        });
    });
});