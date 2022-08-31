import {
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn
} from 'typeorm';
import { VerificationRequestEntity } from './verification-request.entity';
import { VerificationAttachmentType } from '../verification-attachment-type';
import { VerificationAttachmentState } from '../verification-attachment-state';

@Entity()
export class VerificationAttachmentEntity {
    @PrimaryGeneratedColumn('uuid')
    public id!: string;

    @Column()
    public requestId!: string;

    @ManyToOne(() => VerificationRequestEntity, e => e.attachments)
    @JoinColumn()
    public request!: VerificationRequestEntity;

    @Column({ type: 'enum', enum: VerificationAttachmentType})
    public type!: VerificationAttachmentType;

    @Column({ type: 'enum', enum: VerificationAttachmentState, default: VerificationAttachmentState.Pending })
    public state!: VerificationAttachmentState;

    @CreateDateColumn()
    public createTime!: Date;
}
