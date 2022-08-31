import { VerificationRequestEntity } from '../verification-request.entity';
import { VerificationRequest } from '../../verification-request';
import { VerificationAttachmentEntity } from '../verification-attachment.entity';
import { VerificationAttachment } from '../../verification-attachment';
import { Singleton } from '../../../core/ioc';

@Singleton
export class VerificationRequestEntityMapper {
    public fromEntity(source: VerificationRequestEntity): VerificationRequest {
        return {
            id: source.id,
            userId: source.userId,
            provider: source.provider,
            displayName: source.user.displayName || 'Anonymous',
            userLevel: source.user.level,
            userEnabled: source.user.enabled,
            attachments: source.attachments ? source.attachments.map(a => this.attachmentFromEntity(a)) : [],
            createTime: source.createTime,
            expireTime: source.expireTime,
            state: source.state
        };
    }

    public attachmentFromEntity(source: VerificationAttachmentEntity): VerificationAttachment {
        return {
            id: source.id,
            requestId: source.requestId,
            state: source.state,
            type: source.type,
            createTime: source.createTime
        };
    }
}