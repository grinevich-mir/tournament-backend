import { Column, CreateDateColumn, Entity, Generated, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { JackpotAdjustmentPurpose } from '../jackpot-adjustment-purpose';
import { JackpotEntity } from './jackpot.entity';

@Entity()
export class JackpotAdjustmentEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public jackpotId!: number;

    @ManyToOne(() => JackpotEntity)
    @JoinColumn()
    public jackpot!: JackpotEntity;

    @Column({ type: 'decimal', precision: 10, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;

    @Column({ type: 'decimal', precision: 10, scale: 4, transformer: new NumericTransformer() })
    public balance!: number;

    @Column({ type: 'enum', enum: JackpotAdjustmentPurpose })
    public purpose!: JackpotAdjustmentPurpose;

    @Column()
    public sourceRef!: string;

    @CreateDateColumn()
    public createTime!: Date;
}