import { Entity, PrimaryColumn, Generated, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index, OneToOne } from 'typeorm';
import { LeaderboardScheduleEntity } from './leaderboard-schedule.entity';
import { LeaderboardEntity } from './leaderboard.entity';
import { LeaderboardScheduleFrequency } from '../leaderboard-schedule-frequency';

@Entity()
@Index(['startTime', 'endTime'])
export class LeaderboardScheduleItemEntity {
    @PrimaryColumn({ unsigned: true, type: 'int', width: 10 })
    @Generated()
    public id!: number;

    @Column({ length: 50 })
    public scheduleName!: string;

    @ManyToOne(() => LeaderboardScheduleEntity, s => s.schedules)
    @JoinColumn()
    public schedule!: LeaderboardScheduleEntity;

    @Column()
    @Index()
    public frequency!: LeaderboardScheduleFrequency;

    @Column({ type: 'int', unsigned: true, width: 10 })
    public leaderboardId!: number;

    @OneToOne(() => LeaderboardEntity)
    @JoinColumn()
    public leaderboard!: LeaderboardEntity;

    @Column({ default: 0 })
    public minLevel!: number;

    @Column()
    public startTime!: Date;

    @Column()
    public endTime!: Date;

    @Column({ default: true })
    public autoPayout!: boolean;

    @Column({ default: true })
    @Index()
    public enabled!: boolean;

    @Column()
    public finalised!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}