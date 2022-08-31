import { PlatformEvent, PlatformEventAttributes } from '../../core/events';
import { RankedPrize } from '../../prize';

export class LeaderboardPrizeAwardedEvent extends PlatformEvent {
    public get attributes(): PlatformEventAttributes {
        return {
            Type: this.prize.type
        };
    }

    constructor(
        public readonly leaderboardId: number,
        public readonly userId: number,
        public readonly prize: RankedPrize) {
        super('Leaderboard:PrizeAwarded');
    }

}