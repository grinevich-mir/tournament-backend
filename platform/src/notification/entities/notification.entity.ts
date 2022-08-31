import { Column, CreateDateColumn, Entity, Generated, Index, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { NotificationData } from '../notification';
import { NotificationType } from '../notification-type';
import { NotificationRecipientEntity } from './notification-recipient.entity';

@Entity()
export class NotificationEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Index()
    @Column({ readonly: true })
    public type!: NotificationType;

    @Column({ type: 'simple-json'})
    public data!: NotificationData;

    @OneToMany(() => NotificationRecipientEntity, r => r.notification)
    public recipients!: NotificationRecipientEntity[];

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}