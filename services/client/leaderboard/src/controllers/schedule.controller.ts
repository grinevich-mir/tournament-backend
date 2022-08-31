import { Get, Route, Tags, ClientController, Security, Path, Query } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LeaderboardScheduleItem, LeaderboardScheduleManager, LeaderboardManager } from '@tcom/platform/lib/leaderboard';
import { NotFoundError } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ScheduledLeaderboardModel } from '../models';
import { LeaderboardModelMapper } from '@tcom/platform/lib/leaderboard/models';

@Tags('Scheduled')
@Route('leaderboard/schedule')
@LogClass()
export class ScheduleController extends ClientController {
    constructor(
        @Inject private readonly scheduleManager: LeaderboardScheduleManager,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly leaderboardMapper: LeaderboardModelMapper) {
            super();
    }

    /**
     * @summary Gets the currently active leaderboard schedule items
     */
    @Get()
    public async getCurrentItems(): Promise<LeaderboardScheduleItem[]> {
        return this.scheduleManager.getCurrentItems();
    }

    /**
     * @summary Gets the currently active leaderboard schedule item with leaderboard for the specific schedule name
     */
    @Get('{name}')
    @Security('cognito', ['anonymous'])
    public async getCurrentItemLeaderboard(@Path() name: string, @Query() skip: number = 0, @Query() take: number = 20): Promise<ScheduledLeaderboardModel> {
        const item = await this.scheduleManager.getCurrentItem(name);

        if (!item)
            throw new NotFoundError(`Item not found`);

        const leaderboard = await this.leaderboardManager.get(item.leaderboardId, skip, take, this.user?.id);

        if (!leaderboard)
            throw new NotFoundError(`Leaderboard not found`);

        const leaderboardModel = await this.leaderboardMapper.map(leaderboard, this.user?.id);

        const model: ScheduledLeaderboardModel = {
            ...item,
            leaderboard: leaderboardModel
        };

        return model;
    }

    /**
     * @summary Gets the currently active leaderboard schedule item for the specific schedule name
     */
    @Get('{name}/item')
    public async getCurrentItem(name: string): Promise<LeaderboardScheduleItem> {
        const item = await this.scheduleManager.getCurrentItem(name);

        if (!item)
            throw new NotFoundError(`Item not found`);

        return item;
    }
}
