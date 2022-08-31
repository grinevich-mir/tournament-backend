import { Singleton, Inject } from '../../../core/ioc';
import { VerificationGateway } from '../verification-gateway';
import { LEMVerifyClient } from '../../../integration/lemverify';
import { VerificationAttachmentEntity } from '../../entities';
import { LogClass } from '../../../core/logging';
import { VerificationRequest } from '../..';

@Singleton
@LogClass()
export class LEMVerifyVerificationGateway implements VerificationGateway {
    constructor(
        @Inject private readonly client: LEMVerifyClient) {
    }

    public async start(userId: number): Promise<string> {
        const response = await this.client.requestVerification(userId);
        return response.url;
    }

    public async getAttachmentUploadUrl(request: VerificationRequest, attachment: VerificationAttachmentEntity, contentType: string): Promise<string> {
        throw new Error('Not implemented');
    }

    public async getAttachmentUrl(request: VerificationRequest, attachment: VerificationAttachmentEntity): Promise<string> {
        throw new Error('Method not implemented.');
    }

    public async validateAttachment(request: VerificationRequest): Promise<boolean> {
        throw new Error('Not implemented');
    }
}
