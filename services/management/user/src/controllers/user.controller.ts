import { AdminController, Get, Route, Tags, Body, Put, SuccessResponse, Path, Security, Query, Response, Post } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { BadRequestError, NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { UserManager, User, UserProfile, UserProfileUpdate, UserType, UserIp, DisplayNameValidationResult, UserNotificationType, UserNotificationSettingManager, UserNotificationSetting, UserNotificationChannel, UserNotificationSettingUpdate } from '@tcom/platform/lib/user';
import { LogClass, LogOriginator, LogType, UserLogMessage } from '@tcom/platform/lib/core/logging';
import { LogAudit } from '@tcom/platform/lib/admin/decorators';
import { UserFilter } from '@tcom/platform/lib/user/user-filter';
import { UserLogMessageFilter } from '@tcom/platform/lib/user/user-log-message-filter';
import { UserCountryChangeModel, UserDisplayNameCheckModel, UserDisplayNameChangeModel } from '@tcom/platform/lib/user/models';
import { UserIdentityStatusChangeModel, UserBanModel, FraudulentUserModel } from '../models';
import { CRMSender, CRMTemplateName } from '@tcom/platform/lib/crm';
import { ChatManager, ChatUserUpdate } from '@tcom/platform/lib/chat';

@Tags('Users')
@Route('user')
@LogClass()
export class UserController extends AdminController {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmSender: CRMSender,
        @Inject private readonly userNotificationSettingManager: UserNotificationSettingManager,
        @Inject private readonly chatManager: ChatManager) {
        super();
    }

    /**
     * @summary Gets a list of users
     */
    @Get()
    @Security('admin', ['user:read'])
    public async getAll(
        @Query() type?: UserType,
        @Query() enabled?: boolean,
        @Query() subscribed?: boolean,
        @Query() subscribing?: boolean,
        @Query() displayName?: string,
        @Query() email?: string,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() playedFrom?: Date,
        @Query() playedTo?: Date,
        @Query() lastUpdatedFrom?: Date,
        @Query() lastUpdatedTo?: Date,
        @Query() createdFrom?: Date,
        @Query() createdTo?: Date,
        @Query() regCountry?: string,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'): Promise<PagedResult<User>> {
        const filter: UserFilter = {
            type,
            enabled,
            subscribed,
            subscribing,
            page,
            pageSize,
            regCountry,
            fields: {
                displayName,
                email,
                playedFrom,
                playedTo,
                lastUpdatedFrom,
                lastUpdatedTo,
                createdFrom,
                createdTo,
            },
        };

        if (order)
            filter.order = {
                [`${order}`]: direction || 'ASC'
            };

        const users = await this.userManager.getAll(filter);
        return users;
    }

    /**
     * @summary Gets all user log messages, matching the given filters
     * @isDateTime createdFrom
     * @isDateTime createdTo
     */
    @Get('user-log-message')
    @Security('admin', ['user:read'])
    @SuccessResponse(200, 'Ok')
    public async getAllUserLogs(
        @Query() userId?: number,
        @Query() type?: LogType,
        @Query() originator?: LogOriginator,
        @Query() originatorId?: string,
        @Query() application?: string,
        @Query() action?: string,
        @Query() createdFrom?: Date,
        @Query() createdTo?: Date,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<UserLogMessage>> {
        const filter: UserLogMessageFilter = {
            userId,
            type,
            originator,
            originatorId,
            application,
            action,
            createdFrom,
            createdTo,
            page,
            pageSize,
        };

        return this.userManager.getAllUserLogMessages(filter);
    }

    /**
     * @summary Gets a user
     */
    @Get('{id}')
    @Security('admin', ['user:read'])
    public async get(@Path() id: number): Promise<User> {
        const user = await this.userManager.get(id);

        if (!user)
            throw new NotFoundError('User not found.');

        return user;
    }

    /**
     * @summary Gets a user by email address
     */
    @Get('email/{email}')
    @Security('admin', ['user:read'])
    public async getByEmail(email: string): Promise<User> {
        const profile = await this.userManager.getProfileByEmail(email);

        if (!profile)
            throw new NotFoundError('User not found.');

        const user = await this.userManager.get(profile.userId);

        if (!user)
            throw new NotFoundError('User not found.');

        return user;
    }

    /**
     * @summary Enable a user
     */
    @Put('{id}/enable')
    @LogAudit('User', 'Enable User')
    @Security('admin', ['user:write'])
    public async enable(@Path() id: number): Promise<void> {
        const update: ChatUserUpdate = {
            is_active: true
        };

        await this.chatManager.updateUser(id, update);
        await this.userManager.setEnabled(id, true);
    }

    /**
     * @summary Disable a user
     */
    @Put('{id}/disable')
    @LogAudit('User', 'Disable User')
    @Security('admin', ['user:write'])
    public async disable(@Path() id: number): Promise<void> {
        const update: ChatUserUpdate = {
            is_active: false
        };

        await this.chatManager.updateUser(id, update);
        await this.userManager.setEnabled(id, false);
    }

    /**
     * @summary Ban a user with optional reason
     */
    @Put('{id}/ban')
    @LogAudit('User', 'Ban User')
    @Security('admin', ['user:write'])
    public async ban(@Path() id: number, @Body() payload: UserBanModel): Promise<void> {
        const { sendEmail, reason } = payload;

        if (sendEmail)
            await this.crmSender.send(id, UserNotificationType.Account, CRMTemplateName.BanUser, { data: { Reason: reason } });

        await this.userManager.setEnabled(id, false);
    }

    /**
     * @summary Sets a user to internal type
     */
    @Put('{id}/internal')
    @LogAudit('User', 'Make User Internal')
    @Security('admin', ['user:write'])
    public async setInternal(@Path() id: number): Promise<void> {
        await this.userManager.setType(id, UserType.Internal);
    }

    /**
     * @summary Gets a users profile
     */
    @Get('{id}/profile')
    @Security('admin', ['user:write'])
    public async getProfile(@Path() id: number): Promise<UserProfile> {
        const profile = await this.userManager.getProfile(id);

        if (!profile)
            throw new NotFoundError('User not found');

        return profile;
    }

    /**
     * @summary Sets a users profile
     */
    @Put('{id}/profile')
    @LogAudit('User', 'Update User Profile')
    @Security('admin', ['user:write'])
    @SuccessResponse(200, 'Ok')
    public async setProfile(@Path() id: number, @Body() profile: UserProfileUpdate): Promise<void> {
        await this.userManager.setProfile(id, profile);
        this.setStatus(200);
    }

    /**
     * @summary Gets a users IP history
     */
    @Get('{id}/ip/history')
    @Security('admin', ['user:read'])
    @SuccessResponse(200, 'Ok')
    public async getIpHistory(@Path() id: number): Promise<UserIp[]> {
        return this.userManager.getIpHistory(id);
    }

    /**
     * @summary Gets a users that have used the supplied IP address
     */
    @Get('ip/{ip}/user')
    @Security('admin', ['user:read'])
    @SuccessResponse(200, 'Ok')
    public async getUsersByIp(@Path() ip: string): Promise<User[]> {
        return this.userManager.getUsersByIp(ip);
    }

    /**
     * @summary Sets the users display country
     */
    @Put('{id}/country')
    @LogAudit('User', 'Update User Country')
    @Security('admin', ['user:write'])
    @Response<NotFoundError>(404, 'User not found')
    public async setCountry(@Path() id: number, @Body() change: UserCountryChangeModel): Promise<void> {
        await this.userManager.setCountry(id, change.country);
    }

    /**
     * @summary Sets the user verification status
     */

    @Put('{id}/identity-status')
    @LogAudit('User', 'Update User Identity Status')
    @Security('admin', ['user:write'])
    @Response<NotFoundError>(404, 'User not found')
    public async setIdentityStatus(@Path() id: number, @Body() change: UserIdentityStatusChangeModel): Promise<void> {
        await this.userManager.setIdentityStatus(id, change.status);
    }

    /**
     * @summary Sets the user display name
     */
    @Put('{id}/display-name')
    @LogAudit('User', 'Update User Display Name')
    @Security('admin', ['user:write'])
    @Response<NotFoundError>(404, 'User not found')
    public async setDisplayName(@Path() id: number, @Body() displayName: UserDisplayNameChangeModel): Promise<void> {
        await this.userManager.setDisplayName(id, displayName.name);
    }

    /**
     * @summary Validate user display name
     */

    @Post('{id}/display-name/check')
    @Security('admin', ['user:read'])
    @Response<NotFoundError>(404, 'User not found')
    public async checkDisplayName(@Path() id: number, @Body() check: UserDisplayNameCheckModel): Promise<DisplayNameValidationResult> {
        return this.userManager.validateDisplayName(check.name, id);
    }

    /**
     * @summary Returns current user notification settings
     */

    @Get('{id}/notification-setting')
    @Security('admin', ['user:read'])
    @Response<NotFoundError>(404, 'User not found')
    public async viewNotificationsSettings(@Path() id: number): Promise<UserNotificationSetting[]> {
        return this.userNotificationSettingManager.getAll(id);
    }

    /**
     * @summary Updates users notification setting by channel
     */
    @Put('{id}/notification-setting/{channel}')
    @LogAudit('User', 'Update User Notification Settings')
    @Security('admin', ['user:write'])
    public async updateNotificationsSettings(@Path() id: number, @Path() channel: UserNotificationChannel, @Body() update: UserNotificationSettingUpdate): Promise<void> {

        if (Object.keys(update).length === 0)
            throw new BadRequestError('No settings supplied.');

        await this.userNotificationSettingManager.set(id, channel, update);
    }

    @Put('{id}/fraudulent')
    @Security('admin', ['user:write'])
    public async setFraudulent(@Path() id: number, @Body() fraudulent: FraudulentUserModel): Promise<void> {
        await this.userManager.setFraudulent(id, fraudulent.isFraudulent);
    }
}