import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { UserNotificationChannel } from '../user-notification-channel';
import { UserEntity } from './user.entity';

@Entity()
export class UserNotificationSettingEntity {
    @PrimaryColumn()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    public user!: UserEntity;

    @PrimaryColumn({ type: 'enum', enum: UserNotificationChannel })
    public channel!: UserNotificationChannel;

    @Column({ default: true })
    public enabled!: boolean;

    @Column({ default: true })
    public account!: boolean;

    @Column({ default: true })
    public prize!: boolean;

    @Column({ default: true })
    public marketing!: boolean;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}