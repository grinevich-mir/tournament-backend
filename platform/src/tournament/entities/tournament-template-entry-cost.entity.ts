import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TournamentEntryCostBaseEntity } from './tournament-entry-cost-base.entity';
import { TournamentTemplateEntity } from './tournament-template.entity';

@Entity()
export class TournamentTemplateEntryCostEntity extends TournamentEntryCostBaseEntity {
    @Column()
    public templateId!: number;

    @ManyToOne(() => TournamentTemplateEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public template!: TournamentTemplateEntity;
}