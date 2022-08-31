import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { UserEntity } from '../../user/entities';
import { NotificationEntity } from './notification.entity';

@Entity()
export class NotificationRecipientEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    public notificationId!: number;

    @ManyToOne(() => NotificationEntity, n => n.recipients, { onDelete: 'CASCADE' })
    @JoinColumn()
    public notification!: NotificationEntity;

    @PrimaryColumn()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Index()
    @Column({ nullable: true })
    public readTime?: Date;

    @Index()
    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}