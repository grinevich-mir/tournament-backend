import { VerificationProvider } from './verification-provider';
import { VerificationRequestState } from './verification-request-state';
import { VerificationAttachment } from './verification-attachment';

export interface VerificationRequest {
    id: string;
    userId: number;
    displayName: string;
    userLevel: number;
    userEnabled: boolean;
    provider: VerificationProvider;
    state: VerificationRequestState;
    attachments: VerificationAttachment[];
    expireTime: Date;
    createTime: Date;
}