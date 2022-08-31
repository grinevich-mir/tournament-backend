import { ClientController } from '@tcom/platform/lib/api';
import { BadRequestError } from '@tcom/platform/lib/core/errors';
import { Body, Get, Path, Put, Route, Security, Tags } from '@tcom/platform/lib/api/decorators';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UserNotificationSetting, UserNotificationSettingManager } from '@tcom/platform/lib/user';
import { UserNotificationSettingUpdate } from '@tcom/platform/lib/user/user-notification-setting-update';
import { UserNotificationChannel } from '@tcom/platform/lib/user/user-notification-channel';
import { UserManager } from '@tcom/platform/lib/user/user-manager';
import { NotFoundError } from '@tcom/platform/lib/core';

@Tags('Notifications')
@Route('user/setting/notification')
@Security('cognito')
@LogClass()
export class NotificationSettingController extends ClientController {
    constructor(
        @Inject private readonly manager: UserNotificationSettingManager,
        @Inject private readonly userManager: UserManager
    ) {
        super();
    }

    /**
     * @summary Gets the users notifications settings.
     */
    @Get()
    public async getAll(): Promise<UserNotificationSetting[]> {
        const userId = this.user.id;
        return this.manager.getAll(userId);
    }

    /**
     * @summary Sets a users notification setting by channel
     */
    @Put('{channel}')
    public async update(@Path() channel: UserNotificationChannel, @Body() update: UserNotificationSettingUpdate): Promise<void> {
        const userId = this.user.id;

        if (Object.keys(update).length === 0)
            throw new BadRequestError('No settings supplied.');

        await this.manager.set(userId, channel, update);
    }

    /**
     * @summary Disable user notifications
     */
    @Security('cognito', ['anonymous'])
    @Put('disable/{secureId}/{channel}')
    public async disable(@Path() secureId: string, @Path() channel: UserNotificationChannel, @Body() update: UserNotificationSettingUpdate): Promise<void> {
        const user = await this.userManager.get(secureId);

        if (!user)
            throw new NotFoundError('User not found');

        if (Object.keys(update).length === 0)
            update = {
                account: false,
                prize: false,
                marketing: false,
            };

        await this.manager.set(user.id, channel, update);
    }

}
