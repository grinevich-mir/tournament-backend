import { Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import uuid from 'uuid/v4';
import { Jackpot } from './jackpot';
import { JackpotPayout } from './jackpot-payout';
import { JackpotWinner } from './jackpot-winner';

@Singleton
@LogClass()
export class JackpotWinnerMapper {
    public map(payout: JackpotPayout, jackpot: Jackpot): JackpotWinner {
        return {
            id: uuid(),
            jackpotId: jackpot.id,
            jackpotName: jackpot.name,
            jackpotLabel: jackpot.label,
            amount: payout.amount,
            userId: payout.userId,
            date: payout.createTime
        };
    }
}