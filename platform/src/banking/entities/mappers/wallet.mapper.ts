import { Singleton } from '../../../core/ioc';
import { WalletEntity, UserWalletEntity, PlatformWalletEntity } from '../wallet.entity';
import { Wallet } from '../../wallet';
import { WalletAccount } from '../../wallet-account';
import { WalletAccountEntity } from '../wallet-account.entity';
import { WalletType } from '../../wallet-type';

@Singleton
export class WalletEntityMapper {
    public fromEntity(source: WalletEntity): Wallet {
        if (source instanceof UserWalletEntity)
            return {
                type: WalletType.User,
                id: source.id,
                userId: source.userId,
                flow: source.flow,
                createTime: source.createTime
            };

        if (source instanceof PlatformWalletEntity)
            return {
                type: WalletType.Platform,
                id: source.id,
                name: source.name,
                flow: source.flow,
                createTime: source.createTime
            };

        throw new Error(`Wallet type ${source.type} not supported.`);
    }

    public accountFromEntity(source: WalletAccountEntity): WalletAccount {
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