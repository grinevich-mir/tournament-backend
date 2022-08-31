import { Entity, Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';

@Entity()
export class TournamentTypeEntity {
    @PrimaryColumn()
    public id!: number;

    @Column()
    public name!: string;

    @Column()
    public taskDefinition!: string;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}