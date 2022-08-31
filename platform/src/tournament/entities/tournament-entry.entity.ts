import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, Index, Unique, OneToMany } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { TournamentEntity } from './tournament.entity';
import { Type } from 'class-transformer';
import { TournamentEntryPrizeEntity } from './tournament-entry-prize.entity';
import { TournamentEntryAllocationEntity } from './tournament-entry-allocation.entity';

@Entity()
@Unique(['userId', 'tournamentId'])
export class TournamentEntryEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Index()
    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    public user!: UserEntity;

    @Column()
    public tournamentId!: number;

    @ManyToOne(() => TournamentEntity)
    public tournament!: TournamentEntity;

    @Column({ default: false })
    public knockedOut!: boolean;

    @Column({ readonly: true })
    @Index({ unique: true })
    public token!: string;

    @OneToMany(() => TournamentEntryPrizeEntity, p => p.entry)
    public prizes!: TournamentEntryPrizeEntity[];

    @OneToMany(() => TournamentEntryAllocationEntity, a => a.entry, { cascade: ['insert'] })
    public allocations!: TournamentEntryAllocationEntity[];

    @Column({ default: 0 })
    public totalCost!: number;

    @Column({ nullable: true })
    public refundTime?: Date;

    @Column({ nullable: true })
    public activatedTime?: Date;

    @Index()
    @Type(() => Date)
    @CreateDateColumn()
    public createTime!: Date;

    @Type(() => Date)
    @UpdateDateColumn()
    public updateTime!: Date;
}