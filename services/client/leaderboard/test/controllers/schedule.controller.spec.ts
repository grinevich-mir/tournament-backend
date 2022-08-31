import { describe, it, beforeEach } from '@tcom/test';
import { mock, when, instance, reset, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { LeaderboardScheduleManager, LeaderboardScheduleItem, LeaderboardScheduleFrequency, LeaderboardManager, Leaderboard, LeaderboardType, LeaderboardEntry } from '@tcom/platform/lib/leaderboard';
import { ScheduleController } from '../../src/controllers/schedule.controller';
import { NotFoundError } from '@tcom/platform/lib/core';
import { LeaderboardModelMapper, LeaderboardModel, LeaderboardEntryModel } from '@tcom/platform/lib/leaderboard/models';
import { User, UserType } from '@tcom/platform/lib/user';

describe('ScheduleController', () => {
    const mockScheduleManager = mock(LeaderboardScheduleManager);
    const mockLeaderboardManager = mock(LeaderboardManager);
    const mockLeaderboardMapper = mock(LeaderboardModelMapper);

    const scheduleName = 'schedule';
    const userId = 1;
    const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
    const skinId = 'tournament';
    const userType = UserType.Standard;

    const leaderboardEntry: LeaderboardEntry = {
        userId,
        displayName: 'Name',
        country: 'US',
        points: 1,
        tieBreaker: 1,
        rank: 1,
        runningPoints: 1,
        runningTieBreaker: 1
    };

    const leaderboardEntryModel: LeaderboardEntryModel = {
        displayName: 'Name',
        country: 'US',
        points: 1,
        rank: 1,
        runningPoints: 1,
        isPlayer: true
    };

    const item: LeaderboardScheduleItem = {
        id: 1,
        leaderboardId: 1,
        scheduleName,
        autoPayout: true,
        enabled: true,
        createTime: new Date(),
        updateTime: new Date(),
        endTime: new Date(),
        startTime: new Date(),
        finalised: false,
        frequency: LeaderboardScheduleFrequency.Daily,
        minLevel: 0
    };

    function getController(): ScheduleController {
        return new ScheduleController(
            instance(mockScheduleManager),
            instance(mockLeaderboardManager),
            instance(mockLeaderboardMapper));
    }

    beforeEach(() => {
        reset(mockScheduleManager);
        reset(mockLeaderboardManager);
        reset(mockLeaderboardMapper);
    });

    describe('getCurrentItems()', () => {
        it('should return schedule items', async () => {
            // Given
            const items: LeaderboardScheduleItem[] = [];

            when(mockScheduleManager.getCurrentItems()).thenResolve(items);

            const controller = getController();

            // When
            const result = await controller.getCurrentItems();

            // Then
            expect(result).equal(items);
        });
    });

    describe('getCurrentItemLeaderboard()', () => {
        it('should throw item not found error if none are found', async () => {
            // Given
            const controller = getController();

            // When
            const delegate = async () => controller.getCurrentItemLeaderboard(scheduleName);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Item not found');
        });


        it('should throw leaderboard not found error if leaderboard does not exist', async () => {
            // Given
            when(mockScheduleManager.getCurrentItem(scheduleName)).thenResolve(item);

            const controller = getController();

            // When
            const delegate = async () => controller.getCurrentItemLeaderboard(scheduleName);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Leaderboard not found');
        });

        it('should schedule item and leaderboard', async () => {
            // Given
            const leaderboard: Leaderboard = {
                id: 1,
                type: LeaderboardType.Scheduled,
                entryCount: 1,
                entries: [],
                createTime: new Date(),
                finalised: false,
                prizes: []
            };

            const leaderboardModel: LeaderboardModel = {
                entryCount: 1,
                id: 1,
                prizes: [],
                type: LeaderboardType.Global,
                entries: []
            };

            when(mockScheduleManager.getCurrentItem(scheduleName)).thenResolve(item);
            when(mockLeaderboardManager.get(item.leaderboardId, 0, 20, undefined)).thenResolve(leaderboard);
            when(mockLeaderboardMapper.map(leaderboard, undefined)).thenReturn(leaderboardModel);

            const controller = getController();

            // When
            const result = await controller.getCurrentItemLeaderboard(scheduleName);

            // Then
            expect(result).deep.equals({
                ...item,
                leaderboard: leaderboardModel
            });
        });

        context('user is logged in', () => {
            it('should return schedule item and leaderboard without user entry if not found', async () => {
                // Given
                const leaderboard: Leaderboard = {
                    id: 1,
                    type: LeaderboardType.Scheduled,
                    entryCount: 1,
                    entries: [],
                    createTime: new Date(),
                    finalised: false,
                    prizes: []
                };

                const leaderboardModel: LeaderboardModel = {
                    entryCount: 1,
                    id: 1,
                    prizes: [],
                    type: LeaderboardType.Global,
                    entries: []
                };

                when(mockScheduleManager.getCurrentItem(scheduleName)).thenResolve(item);
                when(mockLeaderboardManager.get(item.leaderboardId, 0, 20, userId)).thenResolve(leaderboard);
                when(mockLeaderboardMapper.map(leaderboard, userId)).thenReturn(leaderboardModel);

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
                const result = await controller.getCurrentItemLeaderboard(scheduleName);

                // Then
                expect(result).deep.equals({
                    ...item,
                    leaderboard: leaderboardModel
                });
            });

            it('should return schedule item and leaderboard without user entry if found in retrieved entries', async () => {
                // Given
                const leaderboard: Leaderboard = {
                    id: 1,
                    type: LeaderboardType.Scheduled,
                    entryCount: 1,
                    entries: [leaderboardEntry],
                    createTime: new Date(),
                    finalised: false,
                    prizes: []
                };

                const leaderboardModel: LeaderboardModel = {
                    entryCount: 1,
                    id: 1,
                    prizes: [],
                    type: LeaderboardType.Global,
                    entries: [leaderboardEntryModel]
                };

                when(mockScheduleManager.getCurrentItem(scheduleName)).thenResolve(item);
                when(mockLeaderboardManager.get(item.leaderboardId, 0, 20, userId)).thenResolve(leaderboard);
                when(mockLeaderboardMapper.map(leaderboard, userId)).thenReturn(leaderboardModel);

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
                const result = await controller.getCurrentItemLeaderboard(scheduleName);

                // Then
                expect(result).deep.equals({
                    ...item,
                    leaderboard: leaderboardModel
                });
            });

            it('should return schedule item and leaderboard with user entry if found', async () => {
                // Given
                const leaderboard: Leaderboard = {
                    id: 1,
                    type: LeaderboardType.Scheduled,
                    entryCount: 1,
                    entries: [],
                    createTime: new Date(),
                    finalised: false,
                    prizes: []
                };

                const leaderboardModel: LeaderboardModel = {
                    entryCount: 1,
                    id: 1,
                    prizes: [],
                    type: LeaderboardType.Global,
                    entries: []
                };

                when(mockScheduleManager.getCurrentItem(scheduleName)).thenResolve(item);
                when(mockLeaderboardManager.get(item.leaderboardId, 0, 20, userId)).thenResolve(leaderboard);
                when(mockLeaderboardManager.getEntry(item.leaderboardId, userId)).thenResolve(leaderboardEntry);
                when(mockLeaderboardMapper.map(leaderboard, userId)).thenReturn(leaderboardModel);
                when(mockLeaderboardMapper.mapEntry(leaderboardEntry, userId)).thenReturn(leaderboardEntryModel);

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
                const result = await controller.getCurrentItemLeaderboard(scheduleName);

                // Then
                expect(result).deep.equals({
                    ...item,
                    leaderboard: leaderboardModel
                });
            });
        });
    });

    describe('getCurrentItem()', () => {
        it('should throw item not found error if none are found', async () => {
            // Given
            const controller = getController();

            // When
            const delegate = async () => controller.getCurrentItem(scheduleName);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Item not found');
        });

        it('should schedule item', async () => {
            // Given
            when(mockScheduleManager.getCurrentItem(scheduleName)).thenResolve(item);

            const controller = getController();

            // When
            const result = await controller.getCurrentItem(scheduleName);

            // Then
            expect(result).equals(item);
        });
    });
});