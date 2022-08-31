import { Singleton, IocContainer } from '../../core/ioc';
import { LeaderboardPrizeProcessor } from './leaderboard-prize-processor';
import { LeaderboardCashPrizeProcessor, LeaderboardTangiblePrizeProcessor } from './processors';
import { PrizeType } from '../../prize';
import { LogClass } from '../../core/logging';


@Singleton
@LogClass()
export class LeaderboardPrizeProcessorFactory {
    public create(type: PrizeType): LeaderboardPrizeProcessor {
        switch (type) {
            case PrizeType.Cash:
                return IocContainer.get(LeaderboardCashPrizeProcessor);

            case PrizeType.Tangible:
                return IocContainer.get(LeaderboardTangiblePrizeProcessor);
        }

        throw new Error(`Prize type '${type}' is not supported.`);
    }
}