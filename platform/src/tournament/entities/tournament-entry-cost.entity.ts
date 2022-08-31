import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { TournamentEntryCostBaseEntity } from './tournament-entry-cost-base.entity';
import { TournamentEntity } from './tournament.entity';

@Entity()
export class TournamentEntryCostEntity extends TournamentEntryCostBaseEntity {
    @Column()
    public tournamentId!: number;

    @ManyToOne(() => TournamentEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public tournament!: TournamentEntity;
}