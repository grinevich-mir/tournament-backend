import { Column, CreateDateColumn, Entity, Generated, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Index(['status'])
export class EthTransactionEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column({ nullable: true })
    public completeTime?: Date;

    @Column()
    public transectionId!: string;
    @Column()
    public  orderId!:string;
    @Column()
    public accountId!: string;
    @Column()
    public transactionAmount!: string;
    @Column()
    public status!: number;
       @Column()
    public userId!: number;
    @Column()
    public TransactionStatus!: string;
    @Column()
    public TotalAmount!: string;
    @Column()
    public TransactionDateTime!: string;
    @Column()
    public TransactionResponseJson!: string;
    @Column()
    public UserRequestJson!: string;
    @Column()
    public transactionLogId!: string;

    


}