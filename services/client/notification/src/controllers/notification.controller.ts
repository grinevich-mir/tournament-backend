import { Get, Query, Response, Route, Security, SuccessResponse, Tags, ClientController, Delete, Post } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotificationManager, NotificationFilter, NotificationType, Notification } from '@tcom/platform/lib/notification';
import { BadRequestError, NotFoundError, UnauthorizedError } from '@tcom/platform/lib/core/errors';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { Config, PagedResult } from '@tcom/platform/lib/core';
import { NotificationCountModel } from '../models';

const TEST_NOTIFICATIONS: { [key: string]: any } = {
    TournamentWin: {
        rank: 1,
        tournamentName: 'Hi-Lo Leaderboard',
        tournamentId: 42157,
        prizes: [
            {
                type: 'Cash',
                startRank: 1,
                endRank: 1,
                currencyCode: 'USD',
                amount: 300
            }
        ],
        prizeTotal: {
            currencyCode: 'USD',
            amount: 300
        }
    },
    TournamentJackpotWin: {
        tournamentName: 'Hi-Lo Leaderboard',
        tournamentId: 46768,
        jackpotName: 'Hi-Lo Leaderboard Mini Jackpot',
        jackpotLabel: 'Mini',
        jackpotType: 'Progressive',
        amount: 1742.7,
        threshold: 20,
        winnerCount: 1
    },
    ScheduledLeaderboardWin: {
        rank: 1,
        scheduleName: 'weekly',
        scheduleFrequency: 'Weekly',
        prizes: [
            {
                type: 'Cash',
                startRank: 1,
                endRank: 1,
                currencyCode: 'USD',
                amount: 500
            }
        ],
        prizeTotal: {
            currencyCode: 'USD',
            amount: 500
        }
    }
};

@Tags('Notifications')
@Route('notification')
@Security('cognito')
@LogClass()
export class NotificationController extends ClientController {
    constructor(
        @Inject private readonly notificationManager: NotificationManager) {
        super();
    }

    /**
     * @summary Gets the notifications for the authenticated user
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    @Response<UnauthorizedError>(401)
    public async getAll(@Query() read?: boolean,
        @Query() type?: NotificationType,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Notification>> {
        const userId = this.user.id;
        const filter: NotificationFilter = {
            type,
            read,
            page,
            pageSize
        };

        return this.notificationManager.getAllForUser(userId, filter);
    }

    /**
     * @summary Gets notification count for the authenticated user
     * @isInt id ID must be an integer
     */
    @Get('count')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    public async count(@Query() read?: boolean): Promise<NotificationCountModel> {
        const count = await this.notificationManager.count(this.user.id, read);
        return {
            count
        };
    }

    /**
     * @summary Adds a test notification
     */
    @Post('test')
    public async test(@Query() type: NotificationType = NotificationType.TournamentWin): Promise<Notification> {
        if (Config.stage !== 'dev')
            throw new NotFoundError();

        const body = TEST_NOTIFICATIONS[type];

        if (!body)
            throw new BadRequestError(`Unknown notification type: ${type}`);

        return this.notificationManager.add(type, body, this.user.id);
    }

    /**
     * @summary Marks all notifications as read for the authenticated user
     */
    @Delete('all/read')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    public async markAllAsUnread(): Promise<void> {
        await this.notificationManager.setAllRead(this.user.id, true);
        this.setStatus(200);
    }

    /**
     * @summary Gets a notification by ID
     * @isInt id ID must be an integer
     */
    @Get('{id}')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404, 'Notification not found')
    public async get(id: number): Promise<Notification> {
        const userId = this.user.id;
        const notification = await this.notificationManager.getForUser(userId, id);

        if (!notification)
            throw new NotFoundError('Notification not found');

        return notification;
    }

    /**
     * @summary Mark a notification as read
     * @isInt id ID must be an integer
     */
    @Post('{id}/read')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    public async markAsRead(id: number): Promise<void> {
        await this.notificationManager.setRead(id, this.user.id, true);
        this.setStatus(200);
    }

    /**
     * @summary Mark a notification as unread
     * @isInt id ID must be an integer
     */
    @Delete('{id}/read')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    public async markAsUnread(id: number): Promise<void> {
        await this.notificationManager.setRead(id, this.user.id, false);
        this.setStatus(200);
    }
}
