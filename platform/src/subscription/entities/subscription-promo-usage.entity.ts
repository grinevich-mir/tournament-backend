import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { SubscriptionPromoEntity } from './subscription-promo.entity';
import { SubscriptionEntity } from './subscription.entity';

@Entity()
export class SubscriptionPromoUsageEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public promoId!: number;

    @ManyToOne(() => SubscriptionPromoEntity)
    @JoinColumn()
    public promo!: SubscriptionPromoEntity;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column()
    public subscriptionId!: number;

    @ManyToOne(() => SubscriptionEntity)
    @JoinColumn()
    public subscription!: SubscriptionEntity;

    @Column()
    public accepted!: boolean;

    @Column()
    public expireTime!: Date;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}