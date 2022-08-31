import { Entity, TableInheritance, ChildEntity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, OneToMany, Index, ManyToMany } from 'typeorm';
import { WalletType } from '../wallet-type';
import { UserEntity } from '../../user/entities/user.entity';
import { WalletFlow } from '../wallet-flow';
import { WalletAccountEntity } from './wallet-account.entity';
import { WalletTransactionEntity } from './wallet-transaction.entity';
import { WalletEntryEntity } from './wallet-entry.entity';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: WalletType } })
export abstract class WalletEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'enum', enum: WalletType, readonly: true })
    public type!: WalletType;

    @Column({ type: 'enum', enum: WalletFlow, default: WalletFlow.All })
    public flow!: WalletFlow;

    @OneToMany(() => WalletAccountEntity, a => a.wallet)
    public accounts!: WalletAccountEntity[];

    @ManyToMany(() => WalletEntryEntity, a => a.wallets)
    public entries!: WalletEntryEntity[];

    @OneToMany(() => WalletTransactionEntity, a => a.wallet)
    public transactions!: WalletTransactionEntity[];

    @CreateDateColumn()
    public createTime!: Date;
}

@ChildEntity(WalletType.User)
export class UserWalletEntity extends WalletEntity {
    @Column()
    @Index({ unique: true })
    public userId!: number;

    @OneToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;
}

@ChildEntity(WalletType.Platform)
export class PlatformWalletEntity extends WalletEntity {
    @Column()
    @Index({ unique: true })
    public name!: string;
}