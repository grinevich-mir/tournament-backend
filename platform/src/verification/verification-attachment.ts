import { VerificationAttachmentType } from './verification-attachment-type';
import { VerificationAttachmentState } from './verification-attachment-state';

export interface VerificationAttachment {
    id: string;
    requestId: string;
    type: VerificationAttachmentType;
    state: VerificationAttachmentState;
    url?: string;
    createTime: Date;
}