import { Column, PrimaryColumn, Entity, OneToOne, JoinColumn } from 'typeorm';
import { UserProfileEntity } from './user-profile.entity';

@Entity()
export class UserAddressEntity {
    @PrimaryColumn()
    public profileUserId!: number;

    @OneToOne(() => UserProfileEntity, p => p.address)
    @JoinColumn()
    public profile!: UserProfileEntity;

    @Column({ nullable: true })
    public line1?: string;

    @Column({ nullable: true })
    public line2?: string;

    @Column({ nullable: true })
    public line3?: string;

    @Column({ nullable: true })
    public city?: string;

    @Column({ nullable: true })
    public state?: string;

    @Column()
    public zipCode!: string;

    @Column({ length: 2 })
    public country!: string;
}