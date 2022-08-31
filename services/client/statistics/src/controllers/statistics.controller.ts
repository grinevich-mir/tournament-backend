import { Get, Response, Route, Tags, ClientController, Query, Security } from '@tcom/platform/lib/api';
import { UnauthorizedError } from '@tcom/platform/lib/core/errors';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { StatisticsManager, TopWinnersType } from '@tcom/platform/lib/statistics';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UserManager } from '@tcom/platform/lib/user';
import { TopWinnerModel, BigWinsModel } from '../models';
import { AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';

@Tags('Statistics')
@Route('statistics')
@Security('cognito', ['anonymous'])
@LogClass()
export class StatisticsController extends ClientController {
    constructor(
        @Inject private readonly statsManager: StatisticsManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver) {
        super();
    }

    /**
     * @summary Gets the top lifetime winners
     * @isInt skip
     * @isInt take
     */
    @Get('winners/lifetime')
    @Response<UnauthorizedError>(401)
    public async getLifetimeWinners(@Query() skip: number = 0, @Query() take: number = 20): Promise<TopWinnerModel[]> {
        const winners = await this.statsManager.getTopWinners(skip, take);
        const models: TopWinnerModel[] = [];

        let rank = skip + 1;

        for (const winner of winners) {
            const user = await this.userManager.get(winner.userId);

            models.push({
                rank,
                displayName: user?.displayName || 'Anonymous',
                country: user?.country || 'US',
                avatarUrl: user ? this.avatarUrlResolver.resolve(user) : undefined,
                winnings: winner.winnings,
                isPlayer: this.user && this.user.id === winner.userId
            });

            rank++;
        }

        return models;
    }

    /**
     * @summary Gets the top winners for last 30 days
     * @isInt skip
     * @isInt take
     */
    @Get('winners/30days')
    @Response<UnauthorizedError>(401)
    public async get30DayWinners(@Query() skip: number = 0, @Query() take: number = 20): Promise<TopWinnerModel[]> {
        const winners = await this.statsManager.getTopWinners(skip, take, TopWinnersType.Last30Days);
        const models: TopWinnerModel[] = [];

        let rank = skip + 1;

        for (const winner of winners) {
            const user = await this.userManager.get(winner.userId);

            models.push({
                rank,
                displayName: user?.displayName || 'Anonymous',
                country: user?.country || 'US',
                avatarUrl: user ? this.avatarUrlResolver.resolve(user) : undefined,
                winnings: winner.winnings,
                isPlayer: this.user && this.user.id === winner.userId
            });

            rank++;
        }

        return models;
    }

    /**
     * @summary Gets the latest big wins
     */
    @Get('winners/bigwins')
    @Response<UnauthorizedError>(401)
    public async getBigWins(@Query() count: number): Promise<BigWinsModel[]> {
        const winners = await this.statsManager.getBigWins(count);
        const model: BigWinsModel[] = [];

        for (const winner of winners) {
            const user = await this.userManager.get(winner.userId);
            model.push({
                amount: winner.amount,
                avatarUrl: user ? this.avatarUrlResolver.resolve(user) : undefined,
                country: user?.country || 'US',
                displayName: user?.displayName || 'Anonymous',
                isPlayer: this.user && this.user.id === winner.userId,
                name: winner.name,
                type: winner.type,
            });
        }

        return model;
    }
}
