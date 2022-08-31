import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { SubscriptionPeriod } from '../subscription-period';
import { SubscriptionTierPriceEntity } from './subscription-tier-price.entity';
import { SubscriptionTierEntity } from './subscription-tier.entity';

@Entity()
@Unique(['tierId', 'code'])
export class SubscriptionTierVariantEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column({ length: 10 })
    public code!: string;

    @Column()
    public tierId!: number;

    @ManyToOne(() => SubscriptionTierEntity)
    @JoinColumn()
    public tier!: SubscriptionTierEntity;

    @Column({ type: 'enum', enum: SubscriptionPeriod, default: SubscriptionPeriod.Month })
    public period!: SubscriptionPeriod;

    @Column({ default: 1 })
    public frequency!: number;

    @Column({ default: false })
    public trialEnabled!: boolean;

    @Column({ type: 'enum', enum: SubscriptionPeriod, default: SubscriptionPeriod.Day })
    public trialPeriod!: SubscriptionPeriod;

    @Column({ default: 1 })
    public trialDuration!: number;

    @OneToMany(() => SubscriptionTierPriceEntity, p => p.variant, { cascade: ['insert'] })
    public prices!: SubscriptionTierPriceEntity[];

    @Column({ default: false })
    public default!: boolean;

    @Column({ default: false })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}