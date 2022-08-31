import { Column, CreateDateColumn, Generated, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { JackpotEntity } from '../../jackpot/entities';

export abstract class TournamentJackpotTriggerBaseEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public threshold!: number;

    @Column()
    public jackpotId!: number;

    @ManyToOne(() => JackpotEntity)
    @JoinColumn()
    public jackpot!: JackpotEntity;

    @Column({ default: 0 })
    public minLevel!: number;

    @Column({ default: false })
    public final!: boolean;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}