import { Entity, Column, OneToOne, JoinColumn, CreateDateColumn, PrimaryColumn } from 'typeorm';
import { TournamentEntity } from './tournament.entity';

@Entity()
export class TournamentTaskEntity {
    @PrimaryColumn()
    public tournamentId!: number;

    @OneToOne(() => TournamentEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public tournament!: TournamentEntity;

    @Column({ readonly: true, unique: true })
    public taskId!: string;

    @CreateDateColumn()
    public createTime!: Date;
}