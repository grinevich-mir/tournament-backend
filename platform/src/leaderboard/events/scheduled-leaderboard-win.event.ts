import { PlatformEvent } from '../../core/events';
import { Prize } from '../../prize';

export class ScheduledLeaderboardWinEvent extends PlatformEvent {
    constructor(
        public readonly itemId: number,
        public readonly userId: number,
        public readonly prizes: Prize[],
        public readonly rank: number) {
        super('ScheduledLeaderboard:Win');
    }
}