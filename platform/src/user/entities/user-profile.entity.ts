import { Entity, UpdateDateColumn, CreateDateColumn, Column, OneToOne, PrimaryColumn, Index } from 'typeorm';
import { UserAddressEntity } from './user-address.entity';
import { UserEntity } from './user.entity';

@Entity()
export class UserProfileEntity {
    @PrimaryColumn()
    public userId!: number;

    @OneToOne(() => UserEntity)
    public user!: UserEntity;

    @Column({ length: 50, nullable: true })
    public forename?: string;

    @Column({ length: 50, nullable: true })
    public surname?: string;

    @Index()
    @Column({ nullable: true })
    public email?: string;

    @Column({ default: false })
    public emailVerified!: boolean;

    @Column({ nullable: true })
    public mobileNumber?: string;

    @Column({ default: false })
    public mobileVerified!: boolean;

    @Column({ nullable: true })
    public dob?: Date;

    @OneToOne(() => UserAddressEntity, a => a.profile)
    public address?: UserAddressEntity;

    @Column({ nullable: true, length: 100 })
    public taxId?: string;

    @CreateDateColumn()
    public createTime!: Date;

    @UpdateDateColumn()
    public updateTime!: Date;
}