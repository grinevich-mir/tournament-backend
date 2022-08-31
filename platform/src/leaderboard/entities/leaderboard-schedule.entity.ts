import { Entity, Column, CreateDateColumn, UpdateDateColumn, OneToMany, PrimaryColumn } from 'typeorm';
import { LeaderboardScheduleFrequency } from '../leaderboard-schedule-frequency';
import { LeaderboardScheduleItemEntity } from './leaderboard-schedule-item.entity';
import { LeaderboardPointConfig } from '../leaderboard-point-config';
import { LeaderboardSchedulePrizeEntity } from './leaderboard-schedule-prize.entity';

@Entity()
export class LeaderboardScheduleEntity {
    @PrimaryColumn({ length: 50 })
    public name!: string;

    @Column({ type: 'enum', enum: LeaderboardScheduleFrequency })
    public frequency!: LeaderboardScheduleFrequency;

    @Column({ default: 0 })
    public offset!: number;

    @Column({ type: 'simple-json', nullable: true })
    public pointConfig?: LeaderboardPointConfig;

    @Column({ default: 0 })
    public minLevel!: number;

    @OneToMany(() => LeaderboardSchedulePrizeEntity, i => i.schedule)
    public prizes!: LeaderboardSchedulePrizeEntity[];

    @OneToMany(() => LeaderboardScheduleItemEntity, i => i.schedule)
    public schedules!: LeaderboardScheduleItemEntity[];

    @Column({ default: true })
    public autoPayout!: boolean;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}