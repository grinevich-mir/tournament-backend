import { Inject, Singleton } from '../../../core/ioc';
import { TangibleRankedPrize } from '../../../prize';
import { LeaderboardPrizeProcessor } from '../leaderboard-prize-processor';
import { LogClass } from '../../../core/logging';
import { PlatformEventDispatcher } from '../../../core/events';
import { LeaderboardPrizeAwardedEvent } from '../../../leaderboard/events';


@Singleton
@LogClass()
export class LeaderboardTangiblePrizeProcessor implements LeaderboardPrizeProcessor<TangibleRankedPrize> {

    constructor(@Inject private readonly eventDispatcher: PlatformEventDispatcher,) { }

    public async process(leaderboardId: number, userId: number, prize: TangibleRankedPrize): Promise<void> {
        await this.eventDispatcher.send(new LeaderboardPrizeAwardedEvent(leaderboardId, userId, prize));
    }
}