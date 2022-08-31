import { VerificationRequest } from '../verification-request';
import { VerificationAttachment } from '../verification-attachment';

export interface VerificationGateway {
    start(userId: number): Promise<string>;
    getAttachmentUrl(request: VerificationRequest, attachment: VerificationAttachment): Promise<string>;
    getAttachmentUploadUrl(request: VerificationRequest, attachment: VerificationAttachment, contentType: string): Promise<string>;
    validateAttachment(request: VerificationRequest, attachment: VerificationAttachment): Promise<boolean>;
}
