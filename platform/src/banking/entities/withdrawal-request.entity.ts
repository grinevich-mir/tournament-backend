import {
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { WithdrawalRequestStatus } from '../withdrawal-request-status';
import { CurrencyEntity } from './currency.entity';
import { RequesterType } from '../requester-type';
import { WalletEntryEntity } from './wallet-entry.entity';
import { NumericTransformer } from '../../core/db/orm';
import { WithdrawalProvider } from '../withdrawal-provider';

@Entity()
export class WithdrawalRequestEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ type: 'enum', enum: WithdrawalProvider, default: WithdrawalProvider.PayPal })
    public provider!: WithdrawalProvider;

    @Column({ nullable: true })
    public providerRef?: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, default: '0.0000', transformer: new NumericTransformer() })
    public amount!: number;

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column()
    public walletEntryId!: number;

    @ManyToOne(() => WalletEntryEntity)
    @JoinColumn()
    public walletEntry!: WalletEntryEntity;

    @Index()
    @Column({ type: 'enum', enum: WithdrawalRequestStatus, default: WithdrawalRequestStatus.Pending })
    public status!: WithdrawalRequestStatus;

    @Column({ type: 'enum', enum: RequesterType })
    public requesterType!: RequesterType;

    @Column()
    public requesterId!: string;

    @Index()
    @Column()
    public targetCompletionTime!: Date;

    @Column({ nullable: true })
    public completionTime?: Date;

    @Index()
    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}
