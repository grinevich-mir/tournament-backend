import { AdminController, Route, Tags, Get, Query, Post, Body, Delete, Path, Put, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LeaderboardManager, NewLeaderboard, LeaderboardInfo, Leaderboard, LeaderboardEntry, LeaderboardAdjustment } from '@tcom/platform/lib/leaderboard';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Leaderboard')
@Route('leaderboard')
@LogClass()
export class LeaderboardController extends AdminController {
    constructor(
        @Inject private readonly manager: LeaderboardManager) {
        super();
    }

    /**
     * @summary Creates a new leaderboard
     */
    @Post()
    @Security('admin', ['leaderboard:write'])
    public async add(@Body() newLeaderboard: NewLeaderboard): Promise<LeaderboardInfo> {
        return this.manager.add(newLeaderboard);
    }

    /**
     * @summary Gets a list of active leaderboards
     * @isInt page
     * @isInt pageSize
     */
    @Get('active')
    @Security('admin', ['leaderboard:read'])
    public async getActive(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<PagedResult<LeaderboardInfo>> {
        return this.manager.getActive(page, pageSize);
    }

    /**
     * @summary Gets a list of active leaderboards
     * @isInt page
     * @isInt pageSize
     */
    @Get('inactive')
    @Security('admin', ['leaderboard:read'])
    public async getInactive(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<PagedResult<LeaderboardInfo>> {
        return this.manager.getInactive(page, pageSize);
    }

    /**
     * @summary Gets basic leaderboard info
     */
    @Get('{id}/info')
    @Security('admin', ['leaderboard:read'])
    public async getInfo(@Path() id: number): Promise<LeaderboardInfo> {
        const info = await this.manager.getInfo(id);

        if (!info)
            throw new NotFoundError('Leaderboard not found.');

        return info;
    }

    /**
     * @summary Gets a leaderboard with entries
     * @isInt skip
     * @isInt take
     */
    @Get('{id}')
    @Security('admin', ['leaderboard:read'])
    public async get(@Path() id: number, @Query() skip: number = 0, @Query() take: number = 100, @Query() userId?: number): Promise<Leaderboard> {
        const info = await this.manager.get(id, skip, take, userId);

        if (!info)
            throw new NotFoundError('Leaderboard not found.');

        return info;
    }

    /**
     * @summary Gets a leaderboard around a user
     * @isInt skip
     * @isInt take
     */
    @Get('{id}/{userId}')
    @Security('admin', ['leaderboard:read'])
    public async getAroundUser(@Path() id: number, @Path() userId: number, @Query() count: number = 3): Promise<Leaderboard> {
        const info = await this.manager.getAroundUser(id, userId, count);

        if (!info)
            throw new NotFoundError('Leaderboard not found.');

        return info;
    }

    /**
     * @summary Removes a leaderboard
     */
    @Delete('{id}')
    @Security('admin', ['leaderboard:delete'])
    public async remove(@Path() id: number): Promise<void> {
        return this.manager.remove(id);
    }

    /**
     * @summary Finalises a leaderboard so it cannot be modified
     */
    @Put('{id}/finalise')
    @Security('admin', ['leaderboard:write'])
    public async finalise(@Path() id: number): Promise<void> {
        return this.manager.finalise(id);
    }

    /**
     * @summary Resets a leaderboard
     */
    @Delete('{id}/entry')
    @Security('admin', ['leaderboard:delete'])
    public async reset(@Path() id: number): Promise<void> {
        return this.manager.reset(id);
    }

    /**
     * @summary Adds an entry
     */
    @Post('{id}/entry')
    @Security('admin', ['leaderboard:write'])
    public async addEntry(@Path() id: number, @Body() userId: number): Promise<LeaderboardEntry> {
        return this.manager.addEntry(id, userId);
    }

    /**
     * @summary Removes an entry
     */
    @Delete('{id}/entry/{userId}')
    @Security('admin', ['leaderboard:delete'])
    public async removeEntry(@Path() id: number, @Path() userId: number): Promise<void> {
        await this.manager.removeEntry(id, userId);
    }

    /**
     * @summary Adjusts the points of the provided users in a leaderboard
     */
    @Post('{id}/adjustment')
    @Security('admin', ['leaderboard:write'])
    public async adjustPoints(@Path() id: number, @Body() adjustments: LeaderboardAdjustment[]): Promise<void> {
        await this.manager.adjustPoints(id, ...adjustments);
    }
}
