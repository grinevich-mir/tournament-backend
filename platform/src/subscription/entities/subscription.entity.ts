import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique, JoinTable, ManyToMany } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { SubscriptionStatus } from '../subscription-status';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { SubscriptionTierEntity } from './subscription-tier.entity';
import { NumericTransformer } from '../../core/db/orm';
import { SkinEntity } from '../../skin/entities/skin.entity';
import { PaymentProvider } from '../../payment';
import { PaymentEntity, PaymentMethodEntity } from '../../payment/entities';
import { SubscriptionPeriod } from '../subscription-period';
import { SubscriptionTierVariantEntity } from './subscription-tier-variant.entity';

@Entity()
@Unique(['provider', 'providerRef'])
export class SubscriptionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ length: 10 })
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    @JoinColumn()
    public skin!: SkinEntity;

    @Column({ type: 'enum', enum: PaymentProvider })
    public provider!: PaymentProvider;

    @Column({ length: 36 })
    public providerRef!: string;

    @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.Pending })
    public status!: SubscriptionStatus;

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;

    @Column({ type: 'enum', enum: SubscriptionPeriod, default: SubscriptionPeriod.Month })
    public period!: SubscriptionPeriod;

    @Column({ default: 1 })
    public frequency!: number;

    @Column()
    public tierId!: number;

    @ManyToOne(() => SubscriptionTierEntity)
    @JoinColumn()
    public tier!: SubscriptionTierEntity;

    @Column()
    public tierVariantId!: number;

    @ManyToOne(() => SubscriptionTierVariantEntity)
    @JoinColumn()
    public tierVariant!: SubscriptionTierVariantEntity;

    @Column()
    public level!: number;

    @Column({ nullable: true })
    public nextTierId?: number;

    @ManyToOne(() => SubscriptionTierEntity)
    @JoinColumn()
    public nextTier?: SubscriptionTierEntity;

    @Column({ nullable: true })
    public nextTierVariantId?: number;

    @ManyToOne(() => SubscriptionTierVariantEntity)
    @JoinColumn()
    public nextTierVariant?: SubscriptionTierVariantEntity;

    @Column({ nullable: true })
    public nextTierTime?: Date;

    @Column()
    public paymentMethodId!: number;

    @ManyToOne(() => PaymentMethodEntity)
    @JoinColumn()
    public paymentMethod!: PaymentMethodEntity;

    @ManyToMany(() => PaymentEntity)
    @JoinTable()
    public payments!: PaymentEntity[];

    @Column()
    public periodStartTime!: Date;

    @Column()
    public periodEndTime!: Date;

    @Column({ default: false })
    public trialling!: boolean;

    @Column({ nullable: true })
    public trialStartTime?: Date;

    @Column({ nullable: true })
    public trialEndTime?: Date;

    @Column({ nullable: true })
    public activatedTime?: Date;

    @Column({ nullable: true })
    public expireTime?: Date;

    @Column({ nullable: true })
    public expirationReason?: string;

    @Column({ nullable: true })
    public pauseTime?: Date;

    @Column({ nullable: true })
    public cancelledTime?: Date;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}