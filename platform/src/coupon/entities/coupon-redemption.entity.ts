import { UserEntity } from '../../user/entities';
import { Column, Entity, Generated, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { CouponEntity } from '.';
import { OrderEntity } from '../../order/entities';


@Entity()
export class CouponRedemptionEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column({ type: 'int', unsigned: true, width: 10 })
    public couponId!: number;

    @ManyToOne(() => CouponEntity)
    @JoinColumn()
    public coupon!: CouponEntity;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ type: 'int', unsigned: true, width: 10 })
    public orderId!: number;

    @OneToOne(() => OrderEntity)
    @JoinColumn()
    public order!: OrderEntity;

    @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}