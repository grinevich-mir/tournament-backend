import { Column, CreateDateColumn, Entity, Generated, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { CurrencyEntity } from '../../banking/entities';
import { NumericTransformer } from '../../core/db/orm';
import { PaymentEntity } from '../../payment/entities';
import { UserEntity } from '../../user/entities';
import { OrderStatus } from '../order-status';
import { OrderItemEntity } from './order-item.entity';

@Entity()
@Index(['status', 'createTime'])
export class OrderEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column()
    public description!: string;

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public priceTotal!: number;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
    public status!: OrderStatus;

    @OneToMany(() => OrderItemEntity, i => i.order)
    public items!: OrderItemEntity[];

    @ManyToMany(() => PaymentEntity)
    @JoinTable()
    public payments!: PaymentEntity[];

    @Column({ nullable: true })
    public couponCode?: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public couponTotal?: number;

    @Column({ nullable: true })
    public completeTime?: Date;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}