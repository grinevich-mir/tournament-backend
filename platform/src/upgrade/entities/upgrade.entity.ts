import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, TableInheritance, ChildEntity, OneToOne } from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { UpgradeType } from '../upgrade-type';
import { UpgradeStatus } from '../upgrade-status';
import { SubscriptionEntity } from '../../subscription/entities/subscription.entity';

@Entity()
@TableInheritance({ column: { type: 'enum', name: 'type', enum: UpgradeType } })
export abstract class UpgradeEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'enum', enum: UpgradeType, readonly: true })
    public type!: UpgradeType;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ type: 'enum', enum: UpgradeStatus, default: UpgradeStatus.Pending })
    public status!: UpgradeStatus;

    @Column()
    public level!: number;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}

@ChildEntity(UpgradeType.Scheduled)
export class ScheduledUpgradeEntity extends UpgradeEntity {
    @Column()
    public startTime!: Date;

    @Column()
    public endTime!: Date;
}

@ChildEntity(UpgradeType.Subscription)
export class SubscriptionUpgradeEntity extends UpgradeEntity {
    @Column()
    public subscriptionId!: number;

    @OneToOne(() => SubscriptionEntity)
    @JoinColumn()
    public subscription!: SubscriptionEntity;
}

@ChildEntity(UpgradeType.Manual)
export class ManualUpgradeEntity extends UpgradeEntity {
}