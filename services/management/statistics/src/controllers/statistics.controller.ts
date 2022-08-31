import { AdminController, Get, Route, Tags, Query, Security, FileResult } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { StatisticsFilter, StatisticsManager, StatisticsTop, Statistics, StatisticsTotals, StatisticsIpUserCount, StatisticsIpCountryUserCount, TopWinnersType, IpUserRegistrationStatisticsFilter, StatisticsIpUserRegistration, TournamentsByUser } from '@tcom/platform/lib/statistics';
import { UserPaymentTransactionType, UserPaymentProvider, UserPaymentTransaction, UserPaymentTransactionStatus, StatisticsUserActivity, StatisticsFilterMapper } from '@tcom/platform/lib/statistics';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { TournamentStatisticsFilter } from '@tcom/platform/lib/statistics/tournament-statistics-filter';
import { PagedResult } from '@tcom/platform/lib/core';
import { UserManager } from '@tcom/platform/lib/user';
import { PaymentMethodType } from '@tcom/platform/lib/payment';
import { Parser } from 'json2csv';

@Tags('Statistics')
@Route('statistics')
@Security('admin')
@LogClass()
export class StatisticsController extends AdminController {
    constructor(
        @Inject private readonly manager: StatisticsManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly filterMapper: StatisticsFilterMapper) {
        super();
    }

    /**
     * @summary Get all top player statistics
     */
    @Get('top')
    public async getTop(
        @Query() skip: number = 0,
        @Query() take: number = 20
    ): Promise<StatisticsTop[]> {
        const winners = await this.manager.getTopWinners(skip, take);

        for (const winner of winners) {
            const user = await this.userManager.get(winner.userId);

            if (!user)
                continue;

            winner.displayName = user.displayName || 'Anonymous';
        }

        return winners;
    }

    /**
     * @summary Get all top player statistics
     */
    @Get('top/30days')
    public async getTop30Days(
        @Query() skip: number = 0,
        @Query() take: number = 20
    ): Promise<StatisticsTop[]> {
        const winners = await this.manager.getTopWinners(skip, take, TopWinnersType.Last30Days);

        for (const winner of winners) {
            const user = await this.userManager.get(winner.userId);

            if (!user)
                continue;

            winner.displayName = user.displayName || 'Anonymous';
        }

        return winners;
    }

    /**
     * @summary Get all hourly statistics
     */
    @Get('hourly')
    public async getHourly(
        @Query() from?: Date,
        @Query() to?: Date,
        @Query() skip: number = 0,
        @Query() take: number = 20,
    ): Promise<Statistics[]> {
        const filter: StatisticsFilter = {
            from,
            to,
            skip,
            take,
        };

        return this.manager.getHourly(filter);
    }

    /**
     * @summary Get all daily statistics
     */
    @Get('daily')
    public async getDaily(
        @Query() from?: Date,
        @Query() to?: Date,
        @Query() skip: number = 0,
        @Query() take: number = 20,
    ): Promise<Statistics[]> {
        const filter: StatisticsFilter = {
            from,
            to,
            skip,
            take,
        };

        return this.manager.getDaily(filter);
    }

    /**
     * @summary Get statistics totals
     */
    @Get('total')
    public async getTotals(): Promise<StatisticsTotals> {
        return this.manager.getTotals();
    }

    /**
     * @summary Get user count by IP
     */
    @Get('ip/user')
    public async getUserCountByIp(): Promise<StatisticsIpUserCount[]> {
        return this.manager.getUserCountByIp();
    }

    /**
     * @summary Get user count by geo IP country
     */
    @Get('ip/country/user')
    public async getUserCountByIpCountry(): Promise<StatisticsIpCountryUserCount[]> {
        return this.manager.getUserCountByIpCountry();
    }

    /**
     * @summary Get user registration statistics by geo IP
     */
    @Get('ip/registration/user')
    public async getUserRegistrationsByIp(
        @Query() createdFrom: string,
        @Query() createdTo?: string,
    ): Promise<StatisticsIpUserRegistration[]> {
        createdTo = createdTo ?? createdFrom;

        const filter: IpUserRegistrationStatisticsFilter = {
            createdFrom,
            createdTo
        };

        return this.manager.getUserRegistrationsByIp(filter);
    }

    /**
     * @summary Get per day, per user stats for played tournaments
     */
    @Get('tournament/user')
    @Security('admin', ['statistics:report:read'])
    public async getTournamentReportByUser(
        @Query() page: number = 1,
        @Query() pageSize: number = 50,
        @Query() timeFrom: Date,
        @Query() timeTo: Date,
        @Query() gameId?: number,
        @Query() templateId?: number,
        @Query() userId?: number,
        @Query() displayName?: string
    ): Promise<PagedResult<TournamentsByUser>> {
        const filter: TournamentStatisticsFilter = {
            page,
            pageSize,
            gameId,
            templateId,
            timeFrom,
            timeTo,
            userId,
            displayName
        };

        return this.manager.getTournamentReportByUser(filter);
    }

    /**
     * @summary Get per day, per tournament stats
     */
    @Get('tournament/day')
    @Security('admin', ['statistics:report:read'])
    public async getTournamentReportByDay(
        @Query() page: number = 1,
        @Query() pageSize: number = 50,
        @Query() gameId?: number,
        @Query() templateId?: number,
        @Query() timeFrom?: Date,
        @Query() timeTo?: Date
    ): Promise<PagedResult<any>> {
        const filter: TournamentStatisticsFilter = {
            page,
            pageSize,
            gameId,
            templateId,
            timeFrom,
            timeTo
        };

        return this.manager.getTournamentReportByDay(filter);
    }

    /**
     * @summary Get user payment statistics
     */
    @Get('payment/user')
    @Security('admin', ['statistics:report:read'])
    public async getUserPayments(
        @Query() createdFrom: string,
        @Query() createdTo: string,
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

        return this.manager.getUserPayments(filter);
    }

    /**
     * @summary Get user payment statistics csv export
     */
    @Get('payment/user/export')
    @Security('admin', ['statistics:report:read'])
    public async getUserPaymentsExport(
        @Query() createdFrom: string,
        @Query() createdTo: string,
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
    ): Promise<FileResult> {
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

        const statistics = await this.manager.getUserPayments(filter);
        const parser = new Parser();
        const csv = parser.parse(statistics.items);

        return this.file(csv, `User_Payments_${new Date().toISOString()}.csv`, 'text/csv');
    }

    /**
     * @summary Get user activity statistics
     */
    @Get('activity/user')
    @Security('admin', ['statistics:report:read'])
    public async getUserActivity(
        @Query() createdFrom: string,
        @Query() createdTo: string,
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

        return this.manager.getUserActivity(filter);
    }

    /**
     * @summary Get user activity statistics csv export
     */
    @Get('activity/user/export')
    @Security('admin', ['statistics:report:read'])
    public async getUserActivityExport(
        @Query() createdFrom: string,
        @Query() createdTo: string,
        @Query() userId?: number,
        @Query() displayName?: string,
        @Query() page?: number,
        @Query() pageSize?: number,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'
    ): Promise<FileResult> {
        const filter = this.filterMapper.mapUserActivityFilter(
            createdFrom,
            createdTo,
            userId,
            displayName,
            page,
            pageSize,
            order,
            direction);

        const statistics = await this.manager.getUserActivity(filter);
        const parser = new Parser();
        const csv = parser.parse(statistics.items);

        return this.file(csv, `User_Activity_${new Date().toISOString()}.csv`, 'text/csv');
    }
}