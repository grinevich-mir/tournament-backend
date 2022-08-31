import { Column, CreateDateColumn, Entity, Generated, JoinColumn, ManyToOne, OneToOne, PrimaryColumn } from 'typeorm';
import { WalletEntryEntity } from '../../banking/entities';
import { NumericTransformer } from '../../core/db/orm';
import { UserEntity } from '../../user/entities';
import { JackpotEntity } from './jackpot.entity';

@Entity()
export class JackpotPayoutEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public jackpotId!: number;

    @ManyToOne(() => JackpotEntity)
    @JoinColumn()
    public jackpot!: JackpotEntity;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    public user!: UserEntity;

    @Column({ type: 'decimal', precision: 10, scale: 4, transformer: new NumericTransformer() })
    public amount!: number;

    @Column()
    public walletEntryId!: number;

    @OneToOne(() => WalletEntryEntity)
    @JoinColumn()
    public walletEntry!: WalletEntryEntity;

    @CreateDateColumn()
    public createTime!: Date;
}