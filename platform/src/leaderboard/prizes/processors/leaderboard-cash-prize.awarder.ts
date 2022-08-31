import { Singleton, Inject } from '../../../core/ioc';
import { Ledger, TransactionPurpose, RequesterType, PlatformWallets, UserWalletAccounts } from '../../../banking';
import { LeaderboardPrizeProcessor } from '../leaderboard-prize-processor';
import { CashRankedPrize } from '../../../prize';
import { LogClass } from '../../../core/logging';

@Singleton
@LogClass()
export class LeaderboardCashPrizeProcessor implements LeaderboardPrizeProcessor<CashRankedPrize> {
    constructor(
        @Inject private readonly ledger: Ledger) {
        }

    public async process(leaderboardId: number, userId: number, prize: CashRankedPrize): Promise<void> {
        const targetAccount = prize.currencyCode === 'DIA' ? UserWalletAccounts.Diamonds : UserWalletAccounts.Withdrawable;
        await this.ledger.transfer(prize.amount, prize.currencyCode)
            .purpose(TransactionPurpose.PayOut)
            .requestedBy(RequesterType.System, `Leaderboard:${leaderboardId}`)
            .memo(`Leaderboard ${leaderboardId}, ${prize.type} prize payout`)
            .fromPlatform(PlatformWallets.Prize)
            .toUser(userId, targetAccount)
            .commit();
    }
}