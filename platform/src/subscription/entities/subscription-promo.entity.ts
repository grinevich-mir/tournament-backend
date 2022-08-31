import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SkinEntity } from '../../skin/entities/skin.entity';
import { SubscriptionPeriod } from '../subscription-period';

@Entity()
export class SubscriptionPromoEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ length: 10 })
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    public skin!: SkinEntity;

    @Column({ default: 1 })
    public cycles!: number;

    @Column({ type: 'enum', enum: SubscriptionPeriod, default: SubscriptionPeriod.Month })
    public period!: SubscriptionPeriod;

    @Column({ default: 12 })
    public expireIn!: number;

    @Column({ default: false })
    public onDowngrade!: boolean;

    @Column({ default: true })
    public onCancellation!: boolean;

    @Column({ default: false })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}