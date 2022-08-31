import { Entity, ManyToOne, Column, JoinColumn, PrimaryColumn, Generated, CreateDateColumn, Index } from 'typeorm';
import { NumericTransformer } from '../../core/db/orm';
import { UserEntity } from './user.entity';

@Entity()
export class UserIpEntity {
    @PrimaryColumn({ type: 'int', unsigned: true, width: 10 })
    @Generated()
    public id!: number;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column()
    @Index()
    public ipAddress!: string;

    @Column({ nullable: true, length: 2 })
    public country?: string;

    @Column({ nullable: true })
    public city?: string;

    @Column({ nullable: true })
    public region?: string;

    @Column({ nullable: true })
    public regionCode?: string;

    @Column({ nullable: true })
    public postalCode?: string;

    @Column({ type: 'decimal', precision: 19, scale: 16, transformer: new NumericTransformer(true), nullable: true })
    public latitude?: number;

    @Column({ type: 'decimal', precision: 19, scale: 16, transformer: new NumericTransformer(true), nullable: true })
    public longitude?: number;

    @CreateDateColumn()
    public createTime!: Date;
}