import { PrimaryColumn, Column, ManyToOne, JoinColumn, Entity, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SkinEntity } from '../../skin/entities/skin.entity';

@Entity()
export class UpgradeConfigEntity {
    @PrimaryColumn({ length: 10 })
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    @JoinColumn()
    public skin!: SkinEntity;

    @Column({ default: 24 })
    public codeExpiry!: number;

    @Column({ default: 14 })
    public codeProcessExpiry!: number;

    @Column({ default: 1 })
    public codeUpgradeDuration!: number;

    @Column({ default: 4 })
    public codeUpgradeLevel!: number;

    @Column({ default: 0 })
    public codeDiamonds!: number;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}