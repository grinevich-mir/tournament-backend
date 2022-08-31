import { ClientController } from '@tcom/platform/lib/api';
import { NotFoundError } from '@tcom/platform/lib/core/errors';
import { Query, Post, Response, Route, Security, Tags } from '@tcom/platform/lib/api/decorators';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { VerificationManager, VerificationProvider, VerificationAttachmentType } from '@tcom/platform/lib/verification';
import { VerificationUploadUrlResponseModel, VerificationUrlResponseModel } from '@tcom/platform/lib/verification/models';
import { LogClass, LogMethod } from '@tcom/platform/lib/core/logging';

@Route('user/verify')
@Security('cognito')
@LogClass()
export class VerificationController extends ClientController {
    constructor(
        @Inject private readonly verificationManager: VerificationManager) {
        super();
    }

    /**
     * @summary Gets a url to verify the user
     */
    @Tags('Verify')
    @Post()
    @Response<NotFoundError>(404, 'User not found')
    public async start(): Promise<VerificationUrlResponseModel> {
        const userId = this.user.id;
        const request = await this.verificationManager.start(VerificationProvider.S3, userId);
        return {
            id: request.id
        };
    }

    /**
     * @summary Gets a url to save an attachment to
     */
    @Tags('Verify')
    @Post('attachment')
    @Response<NotFoundError>(404, 'User not found')
    @LogMethod({ result: false })
    public async getUploadUrl(@Query() documentType: VerificationAttachmentType, @Query() contentType: string): Promise<VerificationUploadUrlResponseModel> {
        const userId = this.user.id;
        const [attachment, uploadUrl] = await this.verificationManager.addAttachment(userId, documentType, contentType);

        return {
            id: attachment.id,
            url: uploadUrl
        };
    }

    /**
     * @summary Completes a verification
     */
    @Tags('Verify')
    @Post('validate')
    @Response<NotFoundError>(404, 'User not found')
    public async finish(): Promise<void> {
        const userId = this.user.id;
        await this.verificationManager.validateAttachments(userId);
    }
}
