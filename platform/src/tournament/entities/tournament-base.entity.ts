import { PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, JoinColumn, ManyToOne } from 'typeorm';
import { TournamentTypeEntity } from './tournament-type.entity';
import { SkinEntity } from '../../skin/entities/skin.entity';
import { Type } from 'class-transformer';
import { Region } from '../../core/regions';
import { PowerupType } from '../../powerup/powerup-type';
import { TournamentMetadata } from '../tournament-metadata';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { NumericTransformer } from '../../core/db/orm';
import { TournamentLeaderboardMode } from '../tournament-leaderboard-mode';
import { LeaderboardPointConfig } from '../../leaderboard/leaderboard-point-config';
import { TournamentLeaderboardPointMode } from '../tournament-leaderboard-point-mode';
import { TournamentRuntimeType } from '../tournament-runtime-type';
import { TournamentIntroEntity } from './tournament-intro.entity';

export abstract class TournamentBaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public description!: string;

    @Column({ nullable: true, length: 20 })
    public group?: string;

    @Column({ type: 'text', nullable: true })
    public rules?: string;

    @Column({ length: 20 })
    public region!: Region;

    @Column()
    public typeId!: number;

    @ManyToOne(() => TournamentTypeEntity)
    @JoinColumn()
    public type!: TournamentTypeEntity;

    @Column({ type: 'enum', enum: TournamentRuntimeType, default: TournamentRuntimeType.Fargate })
    public runtime!: TournamentRuntimeType;

    @Column({ default: 0 })
    public displayPriority!: number;

    @Column()
    public bannerImgUrl!: string;

    @ManyToMany(() => SkinEntity, { cascade: ['insert'] })
    @JoinTable()
    public skins!: SkinEntity[];

    @Column({ length: 3 })
    public currencyCode!: string;

    @ManyToOne(() => CurrencyEntity)
    public currency!: CurrencyEntity;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public prizeTotal?: number;

    @Column({ default: 1 })
    public minPlayers!: number;

    @Column({ default: 500 })
    public maxPlayers!: number;

    @Column()
    public autoPayout!: boolean;

    @Column()
    public public!: boolean;

    @Column({ type: 'enum', enum: TournamentLeaderboardMode, default: TournamentLeaderboardMode.Disabled })
    public leaderboardMode!: TournamentLeaderboardMode;

    @Column({ type: 'simple-json', nullable: true })
    public leaderboardPointConfig?: LeaderboardPointConfig;

    @Column({ type: 'enum', enum: TournamentLeaderboardPointMode, default: TournamentLeaderboardPointMode.Cumulative })
    public leaderboardPointMode!: TournamentLeaderboardPointMode;

    @Column({ default: false })
    public chatEnabled!: boolean;

    @Column({ nullable: true, length: 50 })
    public chatChannel?: string;

    @Column({ nullable: true })
    public durationMins?: number;

    @Column({ nullable: true })
    public nameColour?: string;

    @Column({ nullable: true })
    public gameColour?: string;

    @Column({ type: 'simple-array' })
    public allowedPowerups!: PowerupType[];

    @Column()
    public allowJoinAfterStart!: boolean;

    @Column({ nullable: true })
    public entryAllocationRounds?: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public entryAllocationCredit?: number;

    @Column({ nullable: true, default: 1 })
    public maxEntryAllocations?: number;

    @Column({ type: 'simple-json', nullable: true })
    public metadata?: TournamentMetadata;

    @Column({ default: 0 })
    public minLevel!: number;

    @Column({ nullable: true })
    public maxLevel?: number;

    @Column({ type: 'simple-array', nullable: true })
    public contributionGroups?: string[];

    @Column({ nullable: true })
    public introId?: number;

    @ManyToOne(() => TournamentIntroEntity, { nullable: true })
    @JoinColumn()
    public intro?: TournamentIntroEntity;

    @Type(() => Date)
    @CreateDateColumn()
    public createTime!: Date;

    @Type(() => Date)
    @UpdateDateColumn()
    public updateTime!: Date;
}
