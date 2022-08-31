import { Get, Query, Response, Route, Security, Tags, ClientController } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { JackpotWinnerManager } from '@tcom/platform/lib/jackpot';
import { UnauthorizedError } from '@tcom/platform/lib/core/errors';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { JackpotWinnerModel } from '../models';
import { UserManager } from '@tcom/platform/lib/user';
import { AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';

@Tags('Jackpots')
@Route('jackpot')
@LogClass()
export class JackpotController extends ClientController {
    constructor(
        @Inject private readonly jackpotWinnerManager: JackpotWinnerManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver) {
        super();
    }

    /**
     * @summary Gets a list of most recent jackpot winners
     */
    @Get('winner')
    @Response<UnauthorizedError>(401)
    @Security('cognito', ['anonymous'])
    public async getWinners(@Query() count: number = 20): Promise<JackpotWinnerModel[]> {
        if (count <= 0)
            count = 1;

        if (count > 30)
            count = 30;

        const winners = await this.jackpotWinnerManager.getAll(count);
        const winnerModels: JackpotWinnerModel[] = [];

        for (const winner of winners) {
            const user = await this.userManager.get(winner.userId);

            if (!user)
                continue;

            winnerModels.push({
                id: winner.id,
                jackpotId: winner.jackpotId,
                jackpotName: winner.jackpotName,
                jackpotLabel: winner.jackpotLabel,
                amount: winner.amount,
                isPlayer: this.user && this.user.id === winner.userId,
                country: user.country || 'US',
                displayName: user.displayName || 'Anonymous',
                avatarUrl: this.avatarUrlResolver.resolve(user),
                date: winner.date,
            });
        }

        return winnerModels;
    }
}
