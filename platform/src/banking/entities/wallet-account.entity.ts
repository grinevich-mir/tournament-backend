import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ManyToMany, OneToMany, Unique, CreateDateColumn } from 'typeorm';
import { WalletEntity, PlatformWalletEntity, UserWalletEntity } from './wallet.entity';
import { CurrencyEntity } from './currency.entity';
import { WalletEntryEntity } from './wallet-entry.entity';
import { WalletTransactionEntity } from './wallet-transaction.entity';
import { NumericTransformer } from '../../core/db/orm';

@Entity()
@Unique(['walletId', 'name'])
export class WalletAccountEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public walletId!: number;

    @ManyToOne(() => WalletEntity)
    @JoinColumn()
    public wallet!: PlatformWalletEntity | UserWalletEntity;

    @ManyToMany(() => WalletEntryEntity, a => a.accounts)
    public entries!: WalletEntryEntity[];

    @OneToMany(() => WalletTransactionEntity, t => t.account)
    public transactions!: WalletTransactionEntity[];

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, default: '0.0000', transformer: new NumericTransformer() })
    public balance!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, default: '0.0000', transformer: new NumericTransformer() })
    public balanceRaw!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, default: '0.0000', transformer: new NumericTransformer() })
    public baseBalance!: number;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    public balanceUpdateTime!: Date;

    @Column({ default: false, readonly: true })
    public allowNegative!: boolean;

    @CreateDateColumn()
    public createTime!: Date;
}