import {MigrationInterface, QueryRunner, In} from "typeorm";
import { CurrencyEntity, CurrencyRateEntity, WalletAccountEntity, PlatformWalletEntity } from '../../../src/banking/entities';
import { PlatformWallets } from '../../../src/banking/platform-wallets';
import { WalletFlow } from '../../../src/banking/wallet-flow';

const currencies: { [key: string]: { rate: number, userSelectable?: boolean } } = {
    USD: {
        rate: 1
    },
    CAD: { 
        rate: 1.3206
    },
    DIA: { 
        rate: 0.0001, 
        userSelectable:  false 
    }
}

const platformWallets: Partial<PlatformWalletEntity>[] = [
    {
        id: 1,
        name: PlatformWallets.Corporate,
        flow: WalletFlow.All
    },
    {
        id: 2,
        name: PlatformWallets.Correction,
        flow: WalletFlow.All
    },
    {
        id: 3,
        name: PlatformWallets.Prize,
        flow: WalletFlow.Outbound
    },
    {
        id: 4,
        name: PlatformWallets.Chargify,
        flow: WalletFlow.All
    },
    {
        id: 5,
        name: PlatformWallets.PayPal,
        flow: WalletFlow.All
    },
    {
        id: 6,
        name: PlatformWallets.Unipaas,
        flow: WalletFlow.All
    },
    {
        id: 7,
        name: PlatformWallets.Skrill,
        flow: WalletFlow.All
    },
    {
        id: 8,
        name: PlatformWallets.Trustly,
        flow: WalletFlow.All
    },
    {
        id: 9,
        name: PlatformWallets.Referral,
        flow: WalletFlow.All
    }
];

export class Banking0000000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.manager.insert(CurrencyEntity, Object.keys(currencies).map(c => ({ code: c, userSelectable: currencies[c].userSelectable, enabled: true })));
        await queryRunner.manager.insert(CurrencyRateEntity, Object.keys(currencies).map(c => ( { currencyCode: c, rate: currencies[c].rate })));
        await queryRunner.manager.insert(PlatformWalletEntity, platformWallets.map(w => Object.assign({}, w)));

        for (const wallet of platformWallets)
            for (const currency of Object.keys(currencies))
                await queryRunner.manager.insert(WalletAccountEntity, { 
                    walletId: wallet.id, 
                    currencyCode: currency, 
                    name: currency, 
                    allowNegative: wallet.flow !== WalletFlow.Inbound 
                });
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(WalletAccountEntity)
            .where({ walletId: In(platformWallets.map(b => b.id)) })
            .execute();

        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(PlatformWalletEntity)
            .where({ id: In(platformWallets.map(b => b.id)) })
            .execute();

        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(CurrencyRateEntity)
            .where({ currencyCode: In(Object.keys(currencies)) })
            .execute();

        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(CurrencyEntity)
            .where({ code: In(Object.keys(currencies)) })
            .execute();
    }

}
