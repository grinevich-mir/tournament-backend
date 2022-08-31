import { Entity, ManyToOne, JoinColumn, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CurrencyEntity } from './currency.entity';
import { NumericTransformer } from '../../core/db/orm';

@Entity()
export class CurrencyRateEntity {
    @PrimaryColumn({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 10, scale: 4, transformer: new NumericTransformer() })
    public rate!: number;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}
