import { Entity, OneToMany, Column } from 'typeorm';
import { TournamentEntity } from './tournament.entity';
import { TournamentBaseEntity } from './tournament-base.entity';
import { TournamentGameSelectionType } from '../tournament-game-selection-type';
import { TournamentTemplateGameAssignmentEntity } from './tournament-template-game-assignment.entity';
import { TournamentTemplatePrizeEntity } from './tournament-template-prize.entity';
import { TournamentTemplateJackpotTriggerEntity } from './tournament-template-jackpot-trigger.entity';
import { TournamentTemplateEntryCostEntity } from './tournament-template-entry-cost.entity';

@Entity()
export class TournamentTemplateEntity extends TournamentBaseEntity {
    @Column({ default: false })
    public enabled!: boolean;

    @Column({ type: 'simple-array', nullable: true })
    public tags?: string[];

    @OneToMany(() => TournamentTemplateGameAssignmentEntity, a => a.template)
    public gameAssignments!: TournamentTemplateGameAssignmentEntity[];

    @Column({ length: 30 })
    public cronPattern?: string;

    @Column({
        type: 'enum',
        enum: TournamentGameSelectionType,
        default: TournamentGameSelectionType.Sequential
    })
    public gameSelectionType!: TournamentGameSelectionType;

    @OneToMany(() => TournamentEntity, t => t.template)
    public tournaments!: TournamentEntity[];

    @OneToMany(() => TournamentTemplatePrizeEntity, e => e.template)
    public prizes!: TournamentTemplatePrizeEntity[];

    @OneToMany(() => TournamentTemplateEntryCostEntity, e => e.template)
    public entryCosts!: TournamentTemplateEntryCostEntity[];

    @Column({ default: 10 })
    public entryCutOff!: number;

    @OneToMany(() => TournamentTemplateJackpotTriggerEntity, t => t.template)
    public jackpotTriggers!: TournamentTemplateJackpotTriggerEntity[];
}