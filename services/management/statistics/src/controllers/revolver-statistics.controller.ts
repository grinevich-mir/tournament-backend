
import { AdminController, Get, Route, Tags, Query, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { StatisticsManager } from '@tcom/platform/lib/statistics';
import { TournamentStatisticsFilter } from '@tcom/platform/lib/statistics/tournament-statistics-filter';
import { GameProvider } from '@tcom/platform/lib/game';
import { PagedResult } from '@tcom/platform/lib/core';

@Tags('Revolver')
@Route('statistics')
@Security('admin')
@LogClass()
export class RevolverStatisticsController extends AdminController {

    constructor(@Inject private readonly statisticsManager: StatisticsManager) {
        super();
    }

    /**
     * @summary Gets Revolver stats per day, per tournament
     */
    @Get('revolver/tournament/day')
    @Security('admin', ['statistics:report:revolver:read'])
    public async getTournamentReportByDayRevolver(
        @Query() page: number = 1,
        @Query() pageSize: number = 50,
        @Query() gameId?: number,
        @Query() templateId?: number,
        @Query() timeFrom?: Date,
        @Query() timeTo?: Date,
    ): Promise<PagedResult<any>> {
        const filter: TournamentStatisticsFilter = {
            page,
            pageSize,
            gameId,
            templateId,
            timeFrom,
            timeTo,
            providerId: GameProvider.Revolver,
        };

        return this.statisticsManager.getTournamentReportByDay(filter);
    }
}