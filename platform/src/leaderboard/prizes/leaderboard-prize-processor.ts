import { RankedPrize } from '../../prize';

export interface LeaderboardPrizeProcessor<T extends RankedPrize = RankedPrize> {
    process(leaderboardId: number, userId: number, prize: T): Promise<void>;
}