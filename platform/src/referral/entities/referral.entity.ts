import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { ReferralUserEntity } from './referral-user.entity';
import { ReferralRewardEntity } from './referral-reward.entity';

@Entity()
@Unique(['referrerUserId', 'refereeUserId'])
export class ReferralEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public referrerUserId!: number;

    @ManyToOne(() => ReferralUserEntity)
    @JoinColumn()
    public referrer!: ReferralUserEntity;

    @Column()
    public refereeUserId!: number;

    @OneToOne(() => ReferralUserEntity)
    @JoinColumn()
    public referee!: ReferralUserEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public revenue!: number;

    @Column({ default: 0 })
    public rewardCount!: number;

    @Column({ default: 0 })
    public diamondCount!: number;

    @OneToMany(() => ReferralRewardEntity, r => r.referral)
    public rewards!: ReferralRewardEntity[];

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}