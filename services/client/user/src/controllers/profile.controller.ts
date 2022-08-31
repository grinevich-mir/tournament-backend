import { ClientController } from '@tcom/platform/lib/api';
import { NotFoundError } from '@tcom/platform/lib/core/errors';
import { Body, Get, Put, Response, Route, Security, SuccessResponse, Tags } from '@tcom/platform/lib/api/decorators';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UserManager } from '@tcom/platform/lib/user';
import { LogMethod } from '@tcom/platform/lib/core/logging';
import { UserProfileModel, UserProfileUpdateModel, UserModelMapper } from '@tcom/platform/lib/user/models';

@Route('user/profile')
@Security('cognito')
export class ProfileController extends ClientController {
    constructor(
        @Inject private readonly manager: UserManager,
        @Inject private readonly mapper: UserModelMapper) {
        super();
    }

    /**
     * @summary Gets the authenticated users profile
     */
    @Tags('Profile')
    @Response<NotFoundError>(404, 'Profile not found')
    @Get()
    @LogMethod({ result: false })
    public async get(): Promise<UserProfileModel> {
        const profile = await this.manager.getProfile(this.user.id);

        if (!profile)
            throw new NotFoundError('Profile not found');

        return profile;
    }

    /**
     * @summary Sets the authenticated users profile
     */
    @Tags('Profile')
    @Put()
    @SuccessResponse(200, 'Ok')
    @LogMethod({ arguments: false })
    public async set(@Body() model: UserProfileUpdateModel): Promise<void> {
        const update = this.mapper.mapProfileUpdate(model);
        await this.manager.setProfile(this.user.id, update);
        this.setStatus(200);
    }
}
