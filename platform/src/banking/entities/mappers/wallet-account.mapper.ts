import { Singleton } from '../../../core/ioc';
import { WalletAccount } from '../../wallet-account';
import { WalletAccountEntity } from '../wallet-account.entity';

@Singleton
export class WalletAccountEntityMapper {
    public fromEntity(source: WalletAccountEntity): WalletAccount {
        return {
            id: source.id,
            name: source.name,
            walletId: source.walletId,
            allowNegative: source.allowNegative,
            balance: source.balance,
            balanceRaw: source.balanceRaw,
            balanceUpdateTime: source.balanceUpdateTime,
            baseBalance: source.baseBalance,
            currencyCode: source.currencyCode,
            createTime: source.createTime
        };
    }
}