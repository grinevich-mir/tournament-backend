import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { WalletAccountEntity } from './wallet-account.entity';
import { TransactionPurpose } from '../transaction-purpose';
import { CurrencyEntity } from './currency.entity';
import { RequesterType } from '../requester-type';
import { WalletEntryEntity } from './wallet-entry.entity';
import { WalletEntity, PlatformWalletEntity, UserWalletEntity } from './wallet.entity';
import { NumericTransformer } from '../../core/db/orm';

@Entity()
export class WalletTransactionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public walletId!: number;

    @ManyToOne(() => WalletEntity, w => w.transactions)
    @JoinColumn()
    public wallet!: PlatformWalletEntity | UserWalletEntity;

    @Column()
    public accountId!: number;

    @ManyToOne(() => WalletAccountEntity, a => a.transactions)
    @JoinColumn()
    public account!: WalletAccountEntity;

    @Column()
    public entryId!: number;

    @ManyToOne(() => WalletEntryEntity, e => e.transactions)
    @JoinColumn()
    public entry!: WalletEntryEntity;

    @Index()
    @Column({ type: 'enum', enum: TransactionPurpose })
    public purpose!: TransactionPurpose;

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 10, scale: 4, transformer: new NumericTransformer() })
    public exchangeRate!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amountRaw!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public baseAmount!: number;

    @Column({ type: 'enum', enum: RequesterType })
    public requesterType!: RequesterType;

    @Column()
    public requesterId!: string;

    @Index()
    @CreateDateColumn()
    public createTime!: Date;
}