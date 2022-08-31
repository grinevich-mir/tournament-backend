import { Entity, ManyToOne, Column, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { TournamentTemplateEntity } from './tournament-template.entity';
import { TournamentBaseEntity as TournamentBaseEntity } from './tournament-base.entity';
import { Type } from 'class-transformer';
import { TournamentState } from '../tournament-state';
import { GameEntity } from '../../game/entities/game.entity';
import { GameMetadata } from '../../game/game-metadata';
import { TournamentEntryEntity } from './tournament-entry.entity';
import { TournamentPrizeEntity } from './tournament-prize.entity';
import { LeaderboardEntity } from '../../leaderboard/entities';
import { TournamentJackpotTriggerEntity } from './tournament-jackpot-trigger.entity';
import { TournamentEntryCostEntity } from './tournament-entry-cost.entity';

@Entity()
export class TournamentEntity extends TournamentBaseEntity {
    @Column({ default: TournamentState.Scheduled })
    public state!: TournamentState;

    @Column({ default: 0 })
    public playerCount!: number;

    @Column()
    public templateId!: number;

    @ManyToOne(() => TournamentTemplateEntity, t => t.tournaments)
    public template!: TournamentTemplateEntity;

    @Column({ default: 1 })
    public gamePosition!: number;

    @Column()
    public gameId!: number;

    @ManyToOne(() => GameEntity)
    public game!: GameEntity;

    @Column({ type: 'simple-json', nullable: true })
    public gameMetadataOverride!: GameMetadata;

    @OneToMany(() => TournamentEntryEntity, e => e.tournament)
    public entries!: TournamentEntryEntity[];

    @OneToMany(() => TournamentPrizeEntity, e => e.tournament)
    public prizes!: TournamentPrizeEntity[];

    @OneToMany(() => TournamentEntryCostEntity, e => e.tournament)
    public entryCosts!: TournamentEntryCostEntity[];

    @Column({ type: 'int', unsigned: true, width: 10, nullable: true })
    public leaderboardId?: number;

    @OneToOne(() => LeaderboardEntity)
    @JoinColumn()
    public leaderboard?: LeaderboardEntity;

    @OneToMany(() => TournamentJackpotTriggerEntity, t => t.tournament)
    public jackpotTriggers!: TournamentJackpotTriggerEntity[];

    @Column({ default: true })
    public enabled!: boolean;

    @Type(() => Date)
    @Column()
    public launchTime!: Date;

    @Type(() => Date)
    @Column()
    public entryCutOffTime!: Date;

    @Type(() => Date)
    @Column()
    public startTime!: Date;

    @Type(() => Date)
    @Column({ nullable: true })
    public endTime?: Date;

    @Type(() => Date)
    @Column({ nullable: true })
    public completeTime?: Date;
}