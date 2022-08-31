import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, JoinColumn, ManyToOne, OneToMany, TableInheritance, ChildEntity } from 'typeorm';
import { ReferralEventType } from '../referral-event-type';
import { ReferralGroupEntity } from './referral-group.entity';
import { ReferralRuleActionEntity } from './referral-rule-action.entity';
import { NumericTransformer } from '../../core/db/orm';

@Entity()
@Unique(['groupId', 'event', 'order'])
@TableInheritance({ column: { type: 'enum', name: 'event', enum: ReferralEventType } })
export abstract class ReferralRuleEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column()
    public groupId!: number;

    @ManyToOne(() => ReferralGroupEntity)
    @JoinColumn()
    public group!: ReferralGroupEntity;

    @Column({ type: 'enum', enum: ReferralEventType })
    public event!: ReferralEventType;

    @OneToMany(() => ReferralRuleActionEntity, r => r.rule)
    public actions!: ReferralRuleActionEntity[];

    @Column({ default: 1 })
    public order!: number;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}

@ChildEntity(ReferralEventType.SignUp)
export class SignupReferralRuleEntity extends ReferralRuleEntity {
    @Column()
    public count!: number;

    @Column({ default: false })
    public every!: boolean;
}

@ChildEntity(ReferralEventType.Payment)
export class PaymentReferralRuleEntity extends ReferralRuleEntity {
    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public minAmount?: number;

    @Column({ type: 'decimal', precision: 16, scale: 4, transformer: new NumericTransformer(true), nullable: true })
    public minRevenue?: number;
}