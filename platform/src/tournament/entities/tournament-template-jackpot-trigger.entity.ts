import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { TournamentJackpotTriggerBaseEntity } from './tournament-jackpot-trigger-base.entity';
import { TournamentTemplateEntity } from './tournament-template.entity';

@Entity()
@Unique(['templateId', 'jackpotId'])
export class TournamentTemplateJackpotTriggerEntity extends TournamentJackpotTriggerBaseEntity {
    @Column()
    public templateId!: number;

    @ManyToOne(() => TournamentTemplateEntity, t => t.jackpotTriggers)
    @JoinColumn()
    public template!: TournamentTemplateEntity;
}