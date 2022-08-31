import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, TableInheritance, ChildEntity } from 'typeorm';
import { ReferralRuleEntity } from './referral-rule.entity';
import { ReferralRuleActionType } from '../referral-rule-action-type';
import { ReferralTarget } from '../referral-target';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: ReferralRuleActionType } })
export abstract class ReferralRuleActionEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'enum', enum: ReferralRuleActionType })
    public type!: ReferralRuleActionType;

    @Column()
    public ruleId!: number;

    @ManyToOne(() => ReferralRuleEntity, { onDelete: 'CASCADE' })
    @JoinColumn()
    public rule!: ReferralRuleEntity;

    @Column({ default: true })
    public enabled!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}

@ChildEntity(ReferralRuleActionType.AwardDiamonds)
export class AwardDiamondsReferralRuleActionEntity extends ReferralRuleActionEntity {
    @Column()
    public amount!: number;

    @Column({ type: 'enum', enum: ReferralTarget, default: ReferralTarget.Referrer })
    public target!: ReferralTarget;
}

@ChildEntity(ReferralRuleActionType.ChangeGroup)
export class ChangeGroupReferralRuleActionEntity extends ReferralRuleActionEntity {
    @Column()
    public groupId!: number;

    @Column({ type: 'enum', enum: ReferralTarget, default: ReferralTarget.Referrer })
    public target!: ReferralTarget;
}