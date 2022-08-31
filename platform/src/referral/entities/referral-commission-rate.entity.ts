import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { ReferralGroupEntity } from './referral-group.entity';

@Entity()
export class ReferralCommissionRateEntity {
    @PrimaryColumn()
    public groupId!: number;

    @ManyToOne(() => ReferralGroupEntity)
    @JoinColumn()
    public group!: ReferralGroupEntity;

    @PrimaryColumn()
    public level!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public rate!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public minAmount!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), nullable: true })
    public maxAmount?: number | null;

    @Column({ default: false })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}