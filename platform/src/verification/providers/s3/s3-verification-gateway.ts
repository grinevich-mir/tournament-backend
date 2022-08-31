import { Singleton } from '../../../core/ioc';
import { VerificationGateway } from '../verification-gateway';
import AWS from 'aws-sdk';
import * as env from 'env-var';
import { VerificationRequest } from '../../verification-request';
import { VerificationAttachment } from '../../verification-attachment';
import Logger, { LogClass } from '../../../core/logging';

@Singleton
@LogClass({ result: false })
export class S3VerificationGateway implements VerificationGateway {
    public async start(userId: number): Promise<string> {
        return '';
    }

    public async getAttachmentUploadUrl(request: VerificationRequest, attachment: VerificationAttachment, contentType: string): Promise<string> {
        const s3 = new AWS.S3();
        const expiry = 60 * 5;

        const bucket = this.getAttachmentBucket();
        const key = this.getAttachmentKey(request.userId, attachment.id);

        return s3.getSignedUrlPromise('putObject', {
            Bucket: bucket,
            Key: key,
            Expires: expiry,
            ContentType: contentType
        });
    }

    public async getAttachmentUrl(request: VerificationRequest, attachment: VerificationAttachment): Promise<string> {
        const s3 = new AWS.S3();
        const bucket = this.getAttachmentBucket();
        const key = this.getAttachmentKey(request.userId, attachment.id);
        const expiry = 60 * 5;

        return s3.getSignedUrlPromise('getObject', {
            Bucket: bucket,
            Key: key,
            Expires: expiry
        });
    }

    public async validateAttachment(request: VerificationRequest, attachment: VerificationAttachment): Promise<boolean> {
        try {
            const s3 = new AWS.S3();
            const bucket = this.getAttachmentBucket();
            const key = this.getAttachmentKey(request.userId, attachment.id);
            await s3.headObject({
                Bucket: bucket,
                Key: key
            }).promise();
            return true;
        } catch (err) {
            Logger.error(err);
        }

        return false;
    }

    private getAttachmentBucket(): string {
        return env.get('VERIFICATION_BUCKET').required().asString();
    }

    private getAttachmentKey(userId: number, attachmentId: string): string {
        const path = `verification/${userId}/uploads`;
        const key = `${path}/${attachmentId}`;
        return key;
    }
}
