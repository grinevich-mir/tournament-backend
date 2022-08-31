import { Entity, Column, ManyToOne, JoinColumn, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './index';

@Entity()
export class UserCommentEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ type: 'text' })
    public comment!: string;

    @CreateDateColumn()
    public createTime!: Date;

    @Column()
    public userId!: number;

    @Column()
    public author!: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;
}
