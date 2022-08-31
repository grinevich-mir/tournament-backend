import { Entity, Column, CreateDateColumn, UpdateDateColumn, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, OneToOne } from 'typeorm';
import { UserRegistrationType } from '../user-registration-type';
import { UserType } from '../user-type';
import { SkinEntity } from '../../skin/entities/skin.entity';
import { Type } from 'class-transformer';
import { UserAvatarEntity } from './user-avatar.entity';
import { CurrencyEntity } from '../../banking/entities/currency.entity';
import { UserAddressStatus } from '../user-address-status';
import { UserVerificationStatus } from '../user-verification-status';
import { UserMetadata } from '../user-metadata';
import { UserProfileEntity } from './user-profile.entity';

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    public id!: number;

    @Column({ length: 36 })
    @Index({ unique: true })
    public secureId!: string;

    @Column({ length: 10 })
    public skinId!: string;

    @ManyToOne(() => SkinEntity)
    @JoinColumn()
    public skin!: SkinEntity;

    @Column({ nullable: true })
    @Index({ unique: true })
    public displayName?: string;

    @Column({
        type: 'enum',
        enum: UserType
    })
    public type!: UserType;

    @Column({
        type: 'enum',
        enum: UserRegistrationType
    })
    public regType!: UserRegistrationType;

    @Column({ nullable: true })
    public avatarId?: number;

    @ManyToOne(() => UserAvatarEntity, { nullable: true })
    @JoinColumn()
    public avatar?: UserAvatarEntity;

    @OneToOne(() => UserProfileEntity, { nullable: true })
    @JoinColumn({ name: 'id', referencedColumnName : 'userId' })
    public profile?: UserProfileEntity;

    @Column({ nullable: true, length: 36 })
    public customAvatarId?: string;

    @Column({
        length: 50,
        nullable: true
    })
    public chatToken!: string;

    @Column({ default: 0 })
    public level!: number;

    @Column({ length: 2, nullable: true })
    public country?: string;

    @Column({ length: 2, nullable: true })
    public regCountry?: string;

    @Column({ length: 3, nullable: true })
    public regState?: string;

    @Column({ length: 3, nullable: true })
    public currencyCode?: string;

    @ManyToOne(() => CurrencyEntity, { nullable: true })
    @JoinColumn()
    public currency?: CurrencyEntity;

    @Column({
        type: 'enum',
        enum: UserVerificationStatus,
        default: UserVerificationStatus.Unverified
    })
    public identityStatus!: UserVerificationStatus;

    @Column({
        type: 'enum',
        enum: UserAddressStatus,
        default: UserAddressStatus.Pending
    })
    public addressStatus!: UserAddressStatus;

    @Column({ default: true })
    public enabled!: boolean;

    @Column({ nullable: true })
    public lastPlayed?: Date;

    @Column({ nullable: true })
    public ipAddress?: string;

    @Column({ default: 0 })
    public consecutivePlayedDays!: number;

    @Index()
    @Column({ nullable: true })
    public bTag?: string;

    @Column({ default: false })
    public subscribed!: boolean;

    @Column({ default: false })
    public subscribing!: boolean;

    @Column({ default: false })
    public hasPaymentMethod!: boolean;

    @Type(() => Date)
    @CreateDateColumn()
    public createTime!: Date;

    @Type(() => Date)
    @UpdateDateColumn()
    public updateTime!: Date;

    @Column({ type: 'simple-json', nullable: true })
    public metadata?: UserMetadata;

    @Column({ nullable: true, length: 100 })
    public clickId?: string;

    @Column({ default: false })
    public fraudulent!: boolean;
}
