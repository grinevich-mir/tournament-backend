import { PrimaryColumn, Entity, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Generated } from 'typeorm';
import { LeaderboardEntryEntity } from './leaderboard-entry.entity';
import { LeaderboardType } from '../leaderboard-type';
import { LeaderboardPrizeEntity } from './leaderboard-prize.entity';
import { LeaderboardPointConfig } from '../leaderboard-point-config';

@Entity()
export class LeaderboardEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column({ type: 'enum', enum: LeaderboardType })
    public type!: LeaderboardType;

    public entryCount = 0;

    @OneToMany(() => LeaderboardPrizeEntity, p => p.leaderboard)
    public prizes!: LeaderboardPrizeEntity[];

    @Column({ type: 'simple-json', nullable: true })
    public pointConfig?: LeaderboardPointConfig;

    @OneToMany(() => LeaderboardEntryEntity, p => p.leaderboard)
    public entries!: LeaderboardEntryEntity[];

    @Column({ default: false })
    public finalised!: boolean;

    @Column({ nullable: true })
    public payoutTime!: Date;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}