import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { UserEntity } from '../../user/entities';
import { ReferralGroupEntity } from './referral-group.entity';

@Entity()
export class ReferralUserEntity {
    @PrimaryColumn()
    public userId!: number;

    @OneToOne(() => UserEntity)
    public user!: UserEntity;

    @Column({ length: 8, unique: true })
    public code!: string;

    @Column({ unique: true })
    public slug!: string;

    @Column()
    public groupId!: number;

    @ManyToOne(() => ReferralGroupEntity)
    @JoinColumn()
    public group!: ReferralGroupEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public revenue!: number;

    @Column({ default: 0 })
    public referralCount!: number;

    @Column({ default: 0 })
    public rewardCount!: number;

    @Column({ default: 0 })
    public diamondCount!: number;

    @Column({ default: false })
    public active!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}