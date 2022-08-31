import { ChildEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { JackpotType } from '../jackpot-type';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: JackpotType } })
export class JackpotEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'enum', enum: JackpotType, readonly: true })
    public type!: JackpotType;

    @Column()
    public name!: string;

    @Column()
    public label!: string;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}

@ChildEntity(JackpotType.Fixed)
export class FixedJackpotEntity extends JackpotEntity {
    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public seed!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public balance!: number;

    @Column({ default: () => 'CURRENT_TIMESTAMP' })
    public balanceUpdateTime!: Date;

    @Column({ default: true })
    public splitPayout!: boolean;

    @Column({ nullable: true })
    public lastPayoutTime?: Date;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public lastPayoutAmount?: number;
}

@ChildEntity(JackpotType.Progressive)
export class ProgressiveJackpotEntity extends FixedJackpotEntity {
    @Column({ length: 15 })
    public contributionGroup!: string;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public contributionMultiplier!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public maxContribution?: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public maxBalance?: number;
}