import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LogOriginator } from '../../core/logging/log-originator';
import { LogType } from '../../core/logging/log-type';
import { UserEntity } from './user.entity';

@Entity()
export class UserLogEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Index()
    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ type: 'enum', enum: LogType })
    public type!: LogType;

    @Column()
    public action!: string;

    @Column({ type: 'simple-json', nullable: true })
    public data?: { [name: string]: string | number | boolean };

    @Column({ type: 'enum', enum: LogOriginator })
    public originator!: LogOriginator;

    @Column({ nullable: true })
    public originatorId?: string;

    @Column()
    public application!: string;

    @PrimaryColumn()
    public timestamp!: Date;

    @CreateDateColumn()
    public createTime!: Date;
}