import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, CreateDateColumn, OneToMany, JoinTable, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TransactionPurpose } from '../transaction-purpose';
import { RequesterType } from '../requester-type';
import { WalletAccountEntity } from './wallet-account.entity';
import { WalletTransactionEntity } from './wallet-transaction.entity';
import { WalletEntity, PlatformWalletEntity, UserWalletEntity } from './wallet.entity';

@Entity()
export class WalletEntryEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ nullable: true })
    public memo?: string;

    @Index()
    @Column({ type: 'enum', enum: TransactionPurpose })
    public purpose!: TransactionPurpose;

    @Column({ type: 'enum', enum: RequesterType })
    public requesterType!: RequesterType;

    @Column()
    public requesterId!: string;

    @Index()
    @Column({ nullable: true })
    public externalRef?: string;

    @ManyToMany(() => WalletEntity, a => a.entries)
    @JoinTable()
    public wallets!: PlatformWalletEntity[] | UserWalletEntity[];

    @ManyToMany(() => WalletAccountEntity, a => a.entries)
    @JoinTable()
    public accounts!: WalletAccountEntity[];

    @OneToMany(() => WalletTransactionEntity, t => t.entry)
    public transactions!: WalletTransactionEntity[];

    @Column({ nullable: true })
    public linkedEntryId?: number;

    @ManyToOne(() => WalletEntryEntity, { nullable: true })
    @JoinColumn()
    public linkedEntry?: WalletEntryEntity;

    @Index()
    @CreateDateColumn()
    public createTime!: Date;
}