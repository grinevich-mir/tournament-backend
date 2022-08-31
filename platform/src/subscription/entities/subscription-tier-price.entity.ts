import { PrimaryColumn, ManyToOne, JoinColumn, Column, Entity, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { NumericTransformer } from '../../core/db/orm';
import { SubscriptionTierVariantEntity } from './subscription-tier-variant.entity';

@Entity()
export class SubscriptionTierPriceEntity {
    @PrimaryColumn()
    public variantId!: number;

    @ManyToOne(() => SubscriptionTierVariantEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public variant!: SubscriptionTierVariantEntity;

    @PrimaryColumn({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public trialAmount!: number;

    @Column({ default: false })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}