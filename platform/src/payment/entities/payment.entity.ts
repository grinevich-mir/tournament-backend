import { Column, Entity, Generated, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { CurrencyEntity, WalletEntryEntity } from '../../banking/entities';
import { NumericTransformer } from '../../core/db/orm';
import { UserEntity } from '../../user/entities';
import { PaymentErrorCode } from '../payment-error-code';
import { PaymentProvider } from '../payment-provider';
import { PaymentStatus } from '../payment-status';
import { PaymentType } from '../payment-type';
import { PaymentMethodEntity } from './payment-method.entity';

@Entity()
@Index(['status', 'createTime'])
export class PaymentEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ type: 'enum', enum: PaymentType })
    public type!: PaymentType;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.Pending })
    public status!: PaymentStatus;

    @Column()
    public paymentMethodId!: number;

    @ManyToOne(() => PaymentMethodEntity, s => s.payments)
    @JoinColumn()
    public paymentMethod!: PaymentMethodEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ nullable: true })
    public memo?: string;

    @Column({ type: 'enum', enum: PaymentProvider })
    public provider!: PaymentProvider;

    @Column({ length: 32 })
    public providerRef!: string;

    @ManyToMany(() => WalletEntryEntity)
    @JoinTable()
    public walletEntries!: WalletEntryEntity[];

    @Column({ nullable: true, length: 50 })
    public errorCode?: PaymentErrorCode;

    @Column({ nullable: true })
    public voidTime?: Date;

    @Column({ nullable: true })
    public refundTime?: Date;

    @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}