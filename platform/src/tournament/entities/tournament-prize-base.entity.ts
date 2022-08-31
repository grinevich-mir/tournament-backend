import { Column, CreateDateColumn, UpdateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Type } from 'class-transformer';
import { PrizeType } from '../../prize';

export abstract class TournamentPrizeBaseEntity {
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