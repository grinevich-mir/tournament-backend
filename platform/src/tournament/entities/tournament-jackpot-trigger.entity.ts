import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { TournamentJackpotTriggerBaseEntity } from './tournament-jackpot-trigger-base.entity';
import { TournamentEntity } from './tournament.entity';

@Entity()
@Unique(['tournamentId', 'jackpotId'])
export class TournamentJackpotTriggerEntity extends TournamentJackpotTriggerBaseEntity {
    @Column()
    public tournamentId!: number;

    @ManyToOne(() => TournamentEntity, t => t.jackpotTriggers)
    @JoinColumn()
    public tournament!: TournamentEntity;
}