import { Singleton, Inject } from '../core/ioc';
import { StatisticsRepository } from './repositories';
import { StatisticsFilter } from './statistics-filter';
import { Statistics } from './statistics';
import { StatisticsEntityMapper } from './entities/mappers';
import { StatisticsTop } from './statistics-top';
import { LogClass } from '../core/logging';
import { StatisticsTotals } from './statistics-totals';
import { StatisticsIpUserCount } from './statistics-ip-user-count';
import { StatisticsIpCountryUserCount } from './statistics-ip-country-user-count';
import { TournamentStatisticsFilter } from './tournament-statistics-filter';
import { PagedResult } from '../core';
import { TopWinnersCache, TotalsCache, BigWinsCache } from './cache';
import { UserPaymentStatisticsFilter, UserPaymentTransaction } from './statistics-user-payment';
import { StatisticsUserActivity, UserActivityStatisticsFilter } from './statistics-user-activity';
import { IpUserRegistrationStatisticsFilter, StatisticsIpUserRegistration } from './statistics-ip-user-registration';
import { StatisticsBigWins } from './statistics-big-wins';
import { TournamentsByUser } from './statistics-tournaments-by-user';

export enum TopWinnersType {
    Lifetime = 'Lifetime',
    Last30Days = 'Last30Days'
}

@Singleton
@LogClass()
export class StatisticsManager {
    constructor(
        @Inject private readonly topWinnersCache: TopWinnersCache,
        @Inject private readonly totalsCache: TotalsCache,
        @Inject private readonly repository: StatisticsRepository,
        @Inject private readonly entityMapper: StatisticsEntityMapper,
        @Inject private readonly bigWinsCache: BigWinsCache) {
    }

    public async getDaily(filter: StatisticsFilter): Promise<Statistics[]> {
        const entities = await this.repository.getDaily(filter);
        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async getHourly(filter: StatisticsFilter): Promise<Statistics[]> {
        const entities = await this.repository.getHourly(filter);
        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async getTopWinners(skip?: number, take?: number, type: TopWinnersType = TopWinnersType.Lifetime): Promise<StatisticsTop[]> {
        let suffix: string | undefined;

        if (type === TopWinnersType.Last30Days)
            suffix = '30Days';

        const cached = await this.topWinnersCache.getAll(skip, take, suffix);

        if (cached)
            return cached;

        return [];
    }

    public async getTotals(): Promise<StatisticsTotals> {
        const cached = await this.totalsCache.get();

        if (cached)
            return cached;

        return {
            completedWithdrawals: 0,
            liability: 0,
            pendingWithdrawals: 0,
            potentialLiability: 0,
            totalSignUps: 0,
            winnings: 0,
            createTime: new Date()
        };
    }

    public async getUserCountByIp(): Promise<StatisticsIpUserCount[]> {
        return this.repository.getUserCountByIp();
    }

    public async getUserCountByIpCountry(): Promise<StatisticsIpCountryUserCount[]> {
        return this.repository.getUserCountByIpCountry();
    }

    public async getTournamentReportByUser(filter: TournamentStatisticsFilter): Promise<PagedResult<TournamentsByUser>> {
        return this.repository.getTournamentReportByUser(filter);
    }

    public async getTournamentReportByDay(filter: TournamentStatisticsFilter): Promise<PagedResult<any>> {
        return this.repository.getTournamentReportByDay(filter);
    }

    public async getUserPayments(filter: UserPaymentStatisticsFilter): Promise<PagedResult<UserPaymentTransaction>> {
        return this.repository.getUserPayments(filter);
    }

    public async getUserActivity(filter: UserActivityStatisticsFilter): Promise<PagedResult<StatisticsUserActivity>> {
        return this.repository.getUserActivity(filter);
    }

    public async getUserRegistrationsByIp(filter: IpUserRegistrationStatisticsFilter): Promise<StatisticsIpUserRegistration[]> {
        return this.repository.getUserRegistrationsByIp(filter);
    }

    public async getBigWins(count: number): Promise<StatisticsBigWins[]> {
        return this.bigWinsCache.getAll(count);
    }
}