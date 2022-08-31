import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SkinEntity } from '../../skin/entities/skin.entity';

@Entity()
export class UpgradeLevelConfigEntity {
    @PrimaryColumn({ length: 10 })
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    public skin!: SkinEntity;

    @PrimaryColumn()
    public level!: number;

    @Column()
    public tournamentMaxActiveEntries!: number;

    @Column({ type: 'simple-json', nullable: true })
    public withdrawalMinAmounts?: { [currencyCode: string]: number; };

    @Column({ default: 7 })
    public withdrawalTargetDays!: number;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}