import { PrimaryGeneratedColumn, JoinColumn, ManyToOne, Entity, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TournamentEntryEntity } from './tournament-entry.entity';
import { NumericTransformer } from '../../core/db/orm';
import { Type } from 'class-transformer';

@Entity()
export class TournamentEntryAllocationEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public entryId!: number;

    @ManyToOne(() => TournamentEntryEntity, e => e.allocations, { onDelete: 'CASCADE' })
    @JoinColumn()
    public entry!: TournamentEntryEntity;

    @Column({ nullable: true })
    public rounds?: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public credit?: number;

    @Column({ default: false })
    public complete!: boolean;

    @Column({ default: 0 })
    public cost!: number;

    @Type(() => Date)
    @CreateDateColumn()
    public createTime!: Date;

    @Type(() => Date)
    @UpdateDateColumn()
    public updateTime!: Date;
}