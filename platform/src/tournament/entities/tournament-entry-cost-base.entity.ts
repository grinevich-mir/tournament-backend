import { Column, PrimaryGeneratedColumn } from 'typeorm';

export abstract class TournamentEntryCostBaseEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public amount!: number;
}