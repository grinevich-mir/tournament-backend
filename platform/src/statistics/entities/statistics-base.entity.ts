import { Column, CreateDateColumn, UpdateDateColumn, PrimaryColumn } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';

export abstract class StatisticsBaseEntity {
    @PrimaryColumn()
    public date!: Date;

    @Column()
    public usersNew!: number;

    @Column()
    public tournamentNewUsers!: number;

    @Column()
    public tournamentUsers!: number;

    @Column()
    public tournamentEntries!: number;

    @Column()
    public tournamentEntriesAllocations!: number;

    @Column()
    public tournamentEntriesDiamondsSpent!: number;

    @Column()
    public tournamentEntriesDiamondsRefunded!: number;

    @Column()
    public ordersCreated!: number;

    @Column()
    public ordersCreatedNewUsers!: number;

    @Column()
    public ordersCreatedUsers!: number;

    @Column()
    public ordersCompleted!: number;

    @Column()
    public ordersCompletedNewUsers!: number;

    @Column()
    public ordersCompletedUsers!: number;

    @Column()
    public ordersDiamonds!: number;

    @Column()
    public purchaseNewUserCount!: number;

    @Column()
    public purchaseDeclinedNewUserCount!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public purchaseNewUserRevenue!: number;

    @Column()
    public purchaseFirstTimeUserCount!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public purchaseFirstTimeRevenue!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public purchaseFirstTimeRevenueInPeriod!: number;

    @Column()
    public purchaseCount!: number;

    @Column()
    public purchaseUserCount!: number;

    @Column()
    public purchaseDeclinedCount!: number;

    @Column()
    public purchaseDeclinedUserCount!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public purchaseRevenue!: number;

    @Column()
    public subscriptionsNew!: number;

    @Column()
    public subscriptionsRenewed!: number;

    @Column()
    public subscriptionsCancelled!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public subscriptionsNewRevenue!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public subscriptionsRenewedRevenue!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public revenue!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public prizePayoutBase!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public prizePayoutDiamonds!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(), default: '0.0000' })
    public jackpotPayout!: number;

    @Column()
    public jackpotPayoutCount!: number;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}
