import { Column, Entity, Generated, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { CouponProduct, CouponRestrictions } from '../models';

@Entity()
export class CouponEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public validFrom!: Date;

    @Column({ nullable: true })
    public validTo?: Date;

    @Column()
    public code!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), nullable: true })
    public amountOff?: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), nullable: true })
    public percentOff?: number;

    @Column({ type: 'simple-json', nullable: true })
    public bonusItems?: CouponProduct[];

    @Column({ type: 'simple-json', nullable: true })
    public restrictions?: CouponRestrictions;

    @Column({ default: 0 })
    public redemptionCount!: number;

    @Column({ type: 'datetime', precision: 6, default: () => 'CURRENT_TIMESTAMP(6)' })
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}