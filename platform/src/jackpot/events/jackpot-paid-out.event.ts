import { PlatformEvent } from '../../core/events';
import { JackpotPayout } from '../jackpot-payout';

export class JackpotPaidOutEvent extends PlatformEvent {
    constructor(
        public id: number,
        public readonly amount: number,
        public readonly payouts: JackpotPayout[],
        public readonly source: string) {
        super('Jackpot:PaidOut');
    }
}