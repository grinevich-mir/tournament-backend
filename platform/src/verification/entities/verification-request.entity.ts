import {
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    OneToMany
} from 'typeorm';
import { UserEntity } from '../../user/entities';
import { VerificationProvider } from '../verification-provider';
import { VerificationRequestState } from '../verification-request-state';
import { VerificationAttachmentEntity } from './verification-attachment.entity';

@Entity()
export class VerificationRequestEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column({ type: 'enum', enum: VerificationProvider, default: VerificationProvider.S3 })
    public provider!: VerificationProvider;

    @Column()
    public userId!: number;

    @ManyToOne(() => UserEntity)
    @JoinColumn()
    public user!: UserEntity;

    @Column({ default: VerificationRequestState.Pending })
    public state!: VerificationRequestState;

    @OneToMany(() => VerificationAttachmentEntity, p => p.request, { onDelete: 'CASCADE' })
    @JoinColumn()
    public attachments!: VerificationAttachmentEntity[];

    @Column()
    public expireTime!: Date;

    @CreateDateColumn()
    public createTime!: Date;
}
