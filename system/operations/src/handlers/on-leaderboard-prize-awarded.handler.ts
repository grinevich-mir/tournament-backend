import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { Config, lambdaHandler } from '@tcom/platform/lib/core';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { LeaderboardPrizeAwardedEvent } from '@tcom/platform/lib/leaderboard/events';
import { SNSEvent } from 'aws-lambda';
import { EmailSender } from '../email-sender';
import { UserManager } from '@tcom/platform/lib/user';
import { EmailGroup } from '../email-group';
import { TournamentManager } from '@tcom/platform/lib/tournament';
import { PrizeType } from '@tcom/platform/lib/prize';

@Singleton
@LogClass()
export class OnLeaderboardPrizeAwardedHandler extends PlatformEventHandler<LeaderboardPrizeAwardedEvent> {

    constructor(
        @Inject private readonly emailSender: EmailSender,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly tournamentManager: TournamentManager) {
        super();
    }

    protected async process(event: Readonly<LeaderboardPrizeAwardedEvent>): Promise<void> {
        const { leaderboardId, userId, prize } = event;

        if (prize.type !== PrizeType.Tangible) {
            Logger.error(`Prize is not Tangible.`);
            return;
        }

        if (!leaderboardId) {
            Logger.error(`Leaderboard not supplied`);
            return;
        }

        const user = await this.userManager.get(userId);
        if (!user) {
            Logger.error(`User ${userId} not found.`);
            return;
        }

        const tournament = await this.tournamentManager.getByLeaderboardId(leaderboardId);
        if (!tournament) {
            Logger.error(`Tournament not found.`);
            return;
        }

        const data = {
            env: {
                stage: Config.stage,
            },
            leaderboard: {
                userId,
                displayName: user.displayName,
                prizeName: prize.name,
                prizeShortName: prize.shortName,
                prizeCashValue: prize.cashAlternativeAmount,
                prizeImage: prize.imageUrl,
                tournamentId: tournament.id,
                tournamentName: tournament.name
            }
        };

        await this.emailSender.send('LeaderboardPrizeAwarded', data, EmailGroup.Admin);
    }
}

export const onLeaderboardPrizeAwarded = lambdaHandler((event: SNSEvent) => IocContainer.get(OnLeaderboardPrizeAwardedHandler).execute(event));