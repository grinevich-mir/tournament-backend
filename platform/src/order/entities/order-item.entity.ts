import { Column, CreateDateColumn, Entity, Generated, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { OrderItemType } from '../order-item-type';
import { OrderEntity } from './order.entity';

@Entity()
export class OrderItemEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column({ type: 'int', unsigned: true, width: 10 })
    public orderId!: number;

    @ManyToOne(() => OrderEntity)
    @JoinColumn()
    public order!: OrderEntity;

    @Column({ type: 'enum', enum: OrderItemType })
    public type!: OrderItemType;

    @Column()
    public description!: string;

    @Column()
    public quantity!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public price!: number;

    @Column({ nullable: true })
    public processedTime?: Date;

    @CreateDateColumn()
    public createTime!: Date;
}