import { WalletTransactionEntity } from '../wallet-transaction.entity';
import { WalletTransaction } from '../../wallet-transaction';
import { Singleton } from '../../../core/ioc';

@Singleton
export class WalletTransactionEntityMapper {
    public fromEntity(source: WalletTransactionEntity): WalletTransaction {
        return {
            id: source.id,
            entryId: source.entryId,
            accountId: source.accountId,
            walletId: source.walletId,
            amount: source.amount,
            amountRaw: source.amountRaw,
            baseAmount: source.baseAmount,
            currencyCode: source.currencyCode,
            exchangeRate: source.exchangeRate,
            purpose: source.purpose,
            requesterId: source.requesterId,
            requesterType: source.requesterType,
            createTime: source.createTime
        };
    }
}