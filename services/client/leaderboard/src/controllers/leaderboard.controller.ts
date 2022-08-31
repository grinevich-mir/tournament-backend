import { Get, Route, Tags, ClientController, Query, Security, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LeaderboardManager, LeaderboardProgress, LeaderboardProgressManager } from '@tcom/platform/lib/leaderboard';
import { NotFoundError } from '@tcom/platform/lib/core';
import { LeaderboardModel, LeaderboardEntryModel, LeaderboardModelMapper } from '@tcom/platform/lib/leaderboard/models';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Leaderboards')
@Route('leaderboard')
@LogClass()
export class LeaderboardController extends ClientController {
    constructor(
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly progressManager: LeaderboardProgressManager,
        @Inject private readonly mapper: LeaderboardModelMapper) {
            super();
    }

    /**
     * @summary Get a leaderboard
     */
    @Get('{id}')
    @Security('cognito', ['anonymous'])
    public async get(@Path() id: number, @Query() skip: number = 0, @Query() take: number = 20): Promise<LeaderboardModel> {
        const leaderboard = await this.leaderboardManager.get(id, skip, take, this.user?.id);

        if (!leaderboard)
            throw new NotFoundError('Leaderboard not found');

        return this.mapper.map(leaderboard, this.user?.id);
    }

    /**
     * @summary Gets the leaderboard around the authenticated user
     * @isInt id
     * @isInt count
     * @param count The number of other users to show around the authenticated user
     */
    @Get('{id}/around')
    @Security('cognito')
    public async getAroundMe(@Path() id: number, @Query() count = 3): Promise<LeaderboardModel> {
        let leaderboard = await this.leaderboardManager.getAroundUser(id, this.user.id, count);

        if (!leaderboard) {
            const take = count * 2 + 1;
            leaderboard = await this.leaderboardManager.get(id, 0, take);
        }

        if (!leaderboard)
            throw new NotFoundError('Leaderboard not found');

        return this.mapper.map(leaderboard, this.user.id);
    }

    /**
     * @summary Gets the authenticated users entry in the leaderboard
     */
    @Get('{id}/me')
    @Security('cognito')
    public async getMe(@Path() id: number): Promise<LeaderboardEntryModel> {
        const entry = await this.leaderboardManager.getEntry(id, this.user.id);

        if (!entry)
            throw new NotFoundError('User does not exist in this leaderboard');

        return this.mapper.mapEntry(entry, this.user.id);
    }

    /**
     * @summary Gets the authenticated leaderboard point event progress
     */
    @Get('{id}/progress')
    @Security('cognito')
    public async getProgress(@Path() id: number): Promise<LeaderboardProgress[]> {
        return this.progressManager.get(id, this.user.id);
    }
}
