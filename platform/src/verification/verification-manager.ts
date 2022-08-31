import { Inject, Singleton } from '../core/ioc';
import { VerificationGatewayFactory } from './providers/verification-gateway.factory';
import moment from 'moment';
import { VerificationProvider } from './verification-provider';
import { VerificationRequestRepository } from './repositories';
import { VerificationAttachmentEntity, VerificationRequestEntity } from './entities';
import { UserManager, UserNotificationType, UserVerificationStatus } from '../user';
import { VerificationRequestState } from './verification-request-state';
import { BadRequestError, NotFoundError, PagedResult } from '../core';
import { LogClass, UserLog } from '../core/logging';
import { VerificationAttachmentType } from './verification-attachment-type';
import { VerificationRequest } from './verification-request';
import { VerificationAttachmentState } from './verification-attachment-state';
import { VerificationAttachment } from './verification-attachment';
import { VerificationRequestFilter } from './verification-request-filter';
import { CRMSender, CRMTemplateName } from '../crm';
import { VerificationErrorReason } from './verification-error-reason';

@Singleton
@LogClass()
export class VerificationManager {
    constructor(
        @Inject private readonly gatewayFactory: VerificationGatewayFactory,
        @Inject private readonly requestRepository: VerificationRequestRepository,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly userLog: UserLog,
        @Inject private readonly crmSender: CRMSender) {
    }

    public async getAll(filter?: VerificationRequestFilter): Promise<PagedResult<VerificationRequest>> {
        return this.requestRepository.getAll(filter);
    }

    public async get(id: string): Promise<VerificationRequest | undefined> {
        return this.requestRepository.get(id);
    }

    public async getByUserId(id: number): Promise<VerificationRequest | undefined> {
        return this.requestRepository.getByUserId(id);
    }

    public async start(provider: VerificationProvider, userId: number): Promise<VerificationRequest> {
        const existingRequest = await this.getByUserId(userId);

        if (existingRequest && existingRequest.state === VerificationRequestState.Pending)
            return existingRequest;

        return this.userLog.handle(userId, 'Verification:Start', async (logData) => {
            logData.verificationProvider = provider;

            const gateway = this.gatewayFactory.create(provider);
            await gateway.start(userId);

            const request = new VerificationRequestEntity();
            request.provider = VerificationProvider.S3;
            request.userId = userId;
            request.state = VerificationRequestState.Pending;
            request.expireTime = moment().utc().add(30, 'days').toDate();

            const result = await this.requestRepository.add(request);
            logData.verificationRequestId = result.id;
            return result;
        });
    }

    public async getAttachment(id: string): Promise<VerificationAttachment | undefined> {
        return this.requestRepository.getAttachment(id);
    }

    public async addAttachment(userId: number, type: VerificationAttachmentType, contentType: string): Promise<[VerificationAttachment, string]> {
        const request = await this.getByUserId(userId);

        if (!request)
            throw new NotFoundError('Verification request not found.');

        if (request.state !== VerificationRequestState.Pending)
            throw new BadRequestError('Verification request is not pending.');

        return this.userLog.handle(userId, 'Verification:UploadAttachment', async (logData) => {
            logData.verificationProvider = request.provider;

            const entity = new VerificationAttachmentEntity();
            entity.requestId = request.id;
            entity.type = type;

            const attachment = await this.requestRepository.addAttachment(entity);

            const gateway = this.gatewayFactory.create(request.provider);
            const uploadUrl = await gateway.getAttachmentUploadUrl(request, attachment, contentType);

            logData.verificationRequestId = request.id;
            logData.verificationAttachmentId = attachment.id;

            return [
                attachment,
                uploadUrl
            ];
        });
    }

    public async getAttachmentUrl(attachmentId: string): Promise<string | undefined>;
    public async getAttachmentUrl(request: VerificationRequest, attachment: VerificationAttachment): Promise<string | undefined>;
    public async getAttachmentUrl(requestOrAttachmentId: VerificationRequest | string, attachment?: VerificationAttachment): Promise<string | undefined> {
        let request: VerificationRequest | undefined;

        if (typeof requestOrAttachmentId === 'string') {
            attachment = await this.getAttachment(requestOrAttachmentId);

            if (!attachment)
                return undefined;

            request = await this.get(attachment.requestId);
        } else
            request = requestOrAttachmentId;

        if (!request)
            return undefined;

        if (!attachment)
            return undefined;

        const gateway = this.gatewayFactory.create(request.provider);
        return gateway.getAttachmentUrl(request, attachment);
    }

    public async setRequestState(id: string, state: VerificationRequestState, reason?: VerificationErrorReason): Promise<void> {
        const request = await this.requestRepository.get(id);

        if (!request)
            throw new NotFoundError('Verification request not found.');

        await this.userLog.handle(request.userId, 'Verification:Request:StatusChange', async (logData) => {
            logData.verificationRequestId = request.id;

            await this.requestRepository.setState(id, state);
            const userVerificationStatus = this.mapUserVerificationStatus(state);
            await this.userManager.setIdentityStatus(request.userId, userVerificationStatus);

            logData.verificationRequestState = state;
            logData.userVerificationStatus = userVerificationStatus;
        });

        if (state === VerificationRequestState.Complete)
            await this.sendSuccessEmail(request.userId);

        if (state === VerificationRequestState.Error && reason)
            await this.sendFailureEmail(request.userId, reason);
    }

    public async sendSuccessEmail(userId: number): Promise<void> {
        await this.crmSender.send(userId, UserNotificationType.Account, CRMTemplateName.VerificationComplete);
    }

    public async sendFailureEmail(userId: number, reason: VerificationErrorReason): Promise<void> {
        if (reason === VerificationErrorReason.Illegible)
            return this.crmSender.send(userId, UserNotificationType.Account, CRMTemplateName.VerificationFailedIllegible);

        if (reason === VerificationErrorReason.MissingDocuments)
            return this.crmSender.send(userId, UserNotificationType.Account, CRMTemplateName.VerificationFailedMissingDocuments);
    }

    public async validateAttachments(userId: number): Promise<void> {
        const request = await this.requestRepository.getByUserId(userId);

        if (!request)
            throw new NotFoundError('Verification request not found.');

        if (request.state !== VerificationRequestState.Pending)
            throw new BadRequestError('Verification request already validated.');

        return this.userLog.handle(userId, 'Verification:Validate', async (logData) => {
            logData.verificationRequestId = request.id;

            const gateway = this.gatewayFactory.create(request.provider);

            for (const attachment of request.attachments) {
                const valid = await gateway.validateAttachment(request, attachment);

                const state = valid ? VerificationAttachmentState.Complete : VerificationAttachmentState.Error;
                await this.requestRepository.setAttachmentState(attachment.id, state);
            }

            if (request.attachments && request.attachments.length > 0) {
                await this.requestRepository.setState(request.id, VerificationRequestState.Processing);
                await this.userManager.setIdentityStatus(request.userId, UserVerificationStatus.Pending);
            }
        });
    }

    private mapUserVerificationStatus(state: VerificationRequestState): UserVerificationStatus {
        switch (state) {
            case VerificationRequestState.Pending:
                return UserVerificationStatus.Pending;

            case VerificationRequestState.Processing:
                return UserVerificationStatus.Pending;

            case VerificationRequestState.Complete:
                return UserVerificationStatus.Verified;

            case VerificationRequestState.Error:
                return UserVerificationStatus.Unverified;

            default:
                return UserVerificationStatus.Unverified;
        }
    }
}
