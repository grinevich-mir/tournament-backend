import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Unique } from 'typeorm';
import { SkinEntity } from '../../skin/entities/skin.entity';
import { SubscriptionTierVariantEntity } from './subscription-tier-variant.entity';

@Entity()
@Unique(['skinId', 'code'])
@Unique(['skinId', 'level'])
export class SubscriptionTierEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ length: 10 })
    public code!: string;

    @Column()
    public level!: number;

    @Column()
    public name!: string;

    @Column({ length: 10 })
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    @JoinColumn()
    public skin!: SkinEntity;

    @OneToMany(() => SubscriptionTierVariantEntity, v => v.tier, { cascade: ['insert'] })
    public variants!: SubscriptionTierVariantEntity[];

    @Column({ default: false })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}