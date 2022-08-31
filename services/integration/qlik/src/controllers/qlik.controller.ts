import { Controller, Security, Response, Route, SuccessResponse, Tags, Query, Get } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UnauthorizedError } from '@tcom/platform/lib/core/errors';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UpgradeCode, UpgradeCodeFilter, UpgradeCodeManager } from '@tcom/platform/lib/upgrade';
import { GameManager } from '@tcom/platform/lib/game';
import { Game } from '@tcom/platform/lib/game';
import { TournamentStatisticsFilter } from '@tcom/platform/lib/statistics/tournament-statistics-filter';
import { StatisticsManager, StatisticsUserActivity } from '@tcom/platform/lib/statistics';
import { UserPaymentTransactionType, UserPaymentProvider, UserPaymentTransaction, UserPaymentTransactionStatus, StatisticsFilterMapper } from '@tcom/platform/lib/statistics';
import { UserManager, User, UserType } from '@tcom/platform/lib/user';
import { UserFilter } from '@tcom/platform/lib/user/user-filter';
import { PaymentMethodType } from '@tcom/platform/lib/payment';
import moment from 'moment';

@Tags('Qlik')
@Route('qlik')
@Security('qlik')
@LogClass()
export class QlikController extends Controller {
    constructor(
        @Inject private readonly upgradeCodeManager: UpgradeCodeManager,
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly statisticsManager: StatisticsManager,
        @Inject private readonly filterMapper: StatisticsFilterMapper,
        @Inject private readonly userManager: UserManager,
    ) { super(); }


    /**
     * @summary Returns all games
     */
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404)
    @Get('game')
    public async getAllGames(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<PagedResult<Game>> {
        return this.gameManager.getAll({
            page,
            pageSize
        });
    }

    /**
     * @summary Returns stats for played tournaments per day, per user
     */
    @Get('tournament/user')
    public async getTournamentReportByUser(
        @Query() page: number = 1,
        @Query() pageSize: number = 50,
        @Query() gameId?: number,
        @Query() templateId?: number,
        @Query() timeFrom: Date = moment().subtract(10, 'days').startOf('day').toDate(),
        @Query() timeTo: Date = new Date(),
    ): Promise<PagedResult<any>> {
        const filter: TournamentStatisticsFilter = {
            page,
            pageSize,
            gameId,
            templateId,
            timeFrom,
            timeTo,
        };

        return this.statisticsManager.getTournamentReportByUser(filter);
    }

    /**
     * @summary Returns tournament stats per day
     */
    @Get('tournament/day')
    public async getTournamentReportByDay(
        @Query() page: number = 1,
        @Query() pageSize: number = 50,
        @Query() gameId?: number,
        @Query() templateId?: number,
        @Query() timeFrom: Date = moment().subtract(10, 'days').startOf('day').toDate(),
        @Query() timeTo: Date = new Date()
    ): Promise<PagedResult<any>> {
        const filter: TournamentStatisticsFilter = {
            page,
            pageSize,
            gameId,
            templateId,
            timeFrom,
            timeTo,
        };

        return this.statisticsManager.getTournamentReportByDay(filter);
    }

    /**
     * @summary Returns user payment statistics
     */
    @Get('payment/user')
    public async getUserPayments(
        @Query() createdFrom: string = moment().subtract(10, 'days').startOf('day').toDate().toISOString(),
        @Query() createdTo: string = new Date().toISOString(),
        @Query() userId?: number,
        @Query() displayName?: string,
        @Query() email?: string,
        @Query() types?: UserPaymentTransactionType[],
        @Query() paymentMethodTypes?: PaymentMethodType[],
        @Query() providers?: UserPaymentProvider[],
        @Query() statuses?: UserPaymentTransactionStatus[],
        @Query() providerRef?: string,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'
    ): Promise<PagedResult<UserPaymentTransaction>> {
        const filter = this.filterMapper.mapUserPaymentFilter(
            createdFrom,
            createdTo,
            userId,
            displayName,
            email,
            types,
            paymentMethodTypes,
            providers,
            statuses,
            providerRef,
            page,
            pageSize,
            order,
            direction);

        return this.statisticsManager.getUserPayments(filter);
    }

    /**
     * @summary Returns user activity statistics
     */
    @Get('activity/user')
    public async getUserActivity(
        @Query() createdFrom: string = moment().subtract(10, 'days').startOf('day').toDate().toISOString(),
        @Query() createdTo: string = new Date().toISOString(),
        @Query() userId?: number,
        @Query() displayName?: string,
        @Query() page?: number,
        @Query() pageSize?: number,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'
    ): Promise<PagedResult<StatisticsUserActivity>> {
        const filter = this.filterMapper.mapUserActivityFilter(
            createdFrom,
            createdTo,
            userId,
            displayName,
            page,
            pageSize,
            order,
            direction);

        return this.statisticsManager.getUserActivity(filter);
    }

    /**
     * @summary Returns all upgrade codes
     */
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404)
    @Get('code')
    public async getAll(
        @Query() userId?: number,
        @Query() processed?: boolean,
        @Query() expired?: boolean,
        @Query() page: number = 1,
        @Query() pageSize: number = 30): Promise<PagedResult<UpgradeCode>> {
        const filter: UpgradeCodeFilter = {
            userId,
            processed,
            expired,
            page,
            pageSize
        };

        return this.upgradeCodeManager.getAll(filter);
    }

    /**
     * @summary Returns a list of users
     */
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404)
    @Get('user')
    public async getAllUsers(
        @Query() type: UserType = UserType.Standard,
        @Query() enabled?: boolean,
        @Query() subscribed?: boolean,
        @Query() subscribing?: boolean,
        @Query() displayName?: string,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() playedFrom?: Date,
        @Query() playedTo?: Date,
        @Query() lastUpdatedFrom?: Date,
        @Query() lastUpdatedTo?: Date,
        @Query() createdFrom: Date = moment().subtract(10, 'days').startOf('day').toDate(),
        @Query() createdTo: Date = new Date(),
        @Query() regCountry?: string,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'): Promise<PagedResult<User>> {
        const filter: UserFilter = {
            type,
            enabled,
            subscribed,
            subscribing,
            page,
            pageSize,
            regCountry,
            fields: {
                displayName,
                playedFrom,
                playedTo,
                lastUpdatedFrom,
                lastUpdatedTo,
                createdFrom,
                createdTo,
            },
        };

        if (order)
            filter.order = {
                [`${order}`]: direction || 'ASC'
            };

        const users = await this.userManager.getAll(filter);
        return users;
    }
}
