import { Generated, Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, TableInheritance, ChildEntity, OneToOne } from 'typeorm';
import { ReferralEntity } from './referral.entity';
import { ReferralRewardType } from '../referral-reward-type';
import { UserEntity } from '../../user/entities';
import { WalletEntryEntity } from '../../banking/entities';
import { ReferralCommissionType } from '../referral-commission-type';
import { NumericTransformer } from '../../core/db/orm';
import { ReferralEventType } from '../referral-event-type';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: ReferralRewardType } })
export abstract class ReferralRewardEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column({ type: 'enum', enum: ReferralRewardType })
    public type!: ReferralRewardType;

    @Column({ type: 'enum', enum: ReferralEventType })
    public event!: ReferralEventType;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column()
    public referralId!: number;

    @ManyToOne(() => ReferralEntity)
    @JoinColumn()
    public referral!: ReferralEntity;

    @CreateDateColumn()
    public createTime!: Date;
}

@ChildEntity(ReferralRewardType.Diamonds)
export class DiamondsReferralRewardEntity extends ReferralRewardEntity {
    @Column()
    public amount!: number;

    @Column()
    public walletEntryId!: number;

    @ManyToOne(() => WalletEntryEntity)
    @JoinColumn()
    public walletEntry!: WalletEntryEntity;
}

@ChildEntity(ReferralRewardType.Commission)
export class CommissionReferralRewardEntity extends ReferralRewardEntity {
    @Column()
    public level!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public sourceAmount!: number;

    @Column({ type: 'enum', enum: ReferralCommissionType })
    public sourceType!: ReferralCommissionType;

    @Column({ type: 'int', unsigned: true, width: 10 })
    public sourceId!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public rate!: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer() })
    public commission!: number;

    @Column()
    public walletEntryId!: number;

    @OneToOne(() => WalletEntryEntity)
    @JoinColumn()
    public walletEntry!: WalletEntryEntity;
}