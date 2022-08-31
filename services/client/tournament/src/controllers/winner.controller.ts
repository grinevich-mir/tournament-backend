import { Get, Route, Security, Tags, ClientController, Path, Query } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { TournamentModelMapper, TournamentWinnerModel } from '@tcom/platform/lib/tournament/models';
import { TournamentWinnerManager } from '@tcom/platform/lib/tournament';
import { StatisticsManager } from '@tcom/platform/lib/statistics';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager } from '@tcom/platform/lib/user';
import { TournamentTotalWinningsModel } from '../models';

@Tags('Tournament Winners')
@Route('tournament/winner')
@LogClass()
export class WinnerController extends ClientController {
    constructor(
        @Inject private readonly tournamentWinnerManager: TournamentWinnerManager,
        @Inject private readonly statisticsManager: StatisticsManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly mapper: TournamentModelMapper) {
        super();
    }

    /**
     * @summary Gets the total winnings to date
     */
     @Get('total')
     public async getTotals(): Promise<TournamentTotalWinningsModel> {
         const data = await this.statisticsManager.getTotals();
         return {
             amount: data.winnings
         };
     }

    /**
     * @summary Gets a list of most recent tournament winners
     */
    @Get('{skinId}')
    @Security('cognito', ['anonymous'])
    public async getAll(@Path() skinId: string, @Query() count: number = 20): Promise<TournamentWinnerModel[]> {
        if (count <= 0)
            count = 1;

        if (count > 30)
            count = 30;

        const winners = await this.tournamentWinnerManager.getAll(skinId, count);

        if (winners.length === 0)
            return [];

        const models: TournamentWinnerModel[] = [];

        for (const winner of winners) {
            const user = await this.userManager.get(winner.userId);
            const model = this.mapper.mapWinner(winner, user);

            if (this.user && winner.userId === this.user.id)
                model.isPlayer = true;

            models.push(model);
        }

        return models;
    }
}
