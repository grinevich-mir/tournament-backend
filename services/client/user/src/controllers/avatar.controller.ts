import { ClientController } from '@tcom/platform/lib/api';
import { Get, Route, Security, Tags, Put, Body, Response, Post } from '@tcom/platform/lib/api/decorators';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UserModelMapper } from '@tcom/platform/lib/user/models';
import { UserAvatarModel, UserAvatarUpdateModel } from '@tcom/platform/lib/user/models';
import { ForbiddenError, NotFoundError } from '@tcom/platform/lib/core';
import { AvatarProcessor, AvatarUrlResolver } from '@tcom/platform/lib/user/utilities';
import { UserManager, UserAvatarManager } from '@tcom/platform/lib/user';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UploadProcessor } from '../utilities';

@Route('user/avatar')
@Security('cognito')
@LogClass()
export class AvatarController extends ClientController {
    constructor(
        @Inject private readonly avatarManager: UserAvatarManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly mapper: UserModelMapper,
        @Inject private readonly uploadProcessor: UploadProcessor,
        @Inject private readonly avatarProcessor: AvatarProcessor,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver) {
        super();
    }

    /**
     * @summary Gets all available avatars
     */
    @Tags('Avatar')
    @Get('available')
    public async getAll(): Promise<UserAvatarModel[]> {
        const avatars = await this.avatarManager.getAll(this.user.skinId);
        return avatars.map(a => this.mapper.mapAvatar(a));
    }

    /**
     * @summary Updates the current users avatar
     */
    @Tags('Avatar')
    @Put()
    @Response<NotFoundError>(404, 'Avatar not found')
    public async set(@Body()update: UserAvatarUpdateModel): Promise<UserAvatarModel> {
        // TODO: Add level -> feature configuration
        if (this.user.level <= 1)
            throw new ForbiddenError('You do not have access to this feature.');

        const avatar = await this.userManager.setAvatar(this.user.id, update.id);
        return this.mapper.mapAvatar(avatar);
    }

    /**
     * @summary Uploads a custom avatar
     */
    @Tags('Avatar')
    @Post()
    @Response<NotFoundError>(403, 'Avatar must not contain nudity.')
    public async upload(): Promise<string> {
        // TODO: Add level -> feature configuration
        if (this.user.level <= 1)
            throw new ForbiddenError('You do not have access to this feature.');

        await this.uploadProcessor.process(this.request);

        if (!this.request.file)
            throw new Error('Upload failed');

        const avatarId = await this.avatarProcessor.processBuffer(this.request.file.buffer);
        await this.userManager.setCustomAvatar(this.user.id, avatarId);
        return this.avatarUrlResolver.resolve(avatarId);
    }
}
