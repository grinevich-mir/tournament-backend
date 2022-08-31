import { ManyToOne, JoinColumn, Column, CreateDateColumn, UpdateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { LeaderboardEntity } from './leaderboard.entity';

@Entity()
export class LeaderboardEntryEntity {
    @PrimaryColumn()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    public leaderboardId!: number;

    @ManyToOne(() => LeaderboardEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public leaderboard!: LeaderboardEntity;

    @Column({ nullable: true, readonly: true, insert: false, update: false })
    public rank?: number;

    @Column({ default: 0 })
    public points!: number;

    @Column({ default: 0 })
    public tieBreaker!: number;

    @Column({ default: 0 })
    public runningPoints!: number;

    @Column({ default: 0 })
    public runningTieBreaker!: number;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}