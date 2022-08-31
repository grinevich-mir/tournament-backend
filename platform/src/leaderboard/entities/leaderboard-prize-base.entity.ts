import { Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PrizeType } from '../../prize';
import { Type } from 'class-transformer';

export abstract class LeaderboardPrizeBaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public startRank!: number;

    @Column()
    public endRank!: number;

    @Column({ type: 'enum', enum: PrizeType, readonly: true })
    public type!: PrizeType;

    @Type(() => Date)
    @CreateDateColumn()
    public createTime!: Date;

    @Type(() => Date)
    @UpdateDateColumn()
    public updateTime!: Date;
}