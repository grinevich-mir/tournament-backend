import { ClientController } from '@tcom/platform/lib/api';
import { NotFoundError, ConflictError, ForbiddenError } from '@tcom/platform/lib/core/errors';
import { Body, Get, Post, Put, Response, Route, Security, Tags } from '@tcom/platform/lib/api/decorators';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UserModelMapper, UserModel, UserDisplayNameCheckModel, UserDisplayNameChangeModel, UserCurrencyChangeModel, UserCountryChangeModel } from '@tcom/platform/lib/user/models';
import { UserManager, DisplayNameValidationResult, UserMetadata } from '@tcom/platform/lib/user';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { UserMetadataModel } from '../models';

@Route('user')
@Security('cognito')
@LogClass()
export class UserController extends ClientController {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly mapper: UserModelMapper) {
        super();
    }

    /**
     * @summary Gets the authenticated user
     */
    @Tags('User')
    @Response<NotFoundError>(404, 'User not found')
    @Get()
    public async get(): Promise<UserModel> {
        if (!this.user.ipAddress || this.user.ipAddress !== this.request.ip)
            await this.userManager.updateIpData(this.user.id, this.request.ip, this.request.geoIp);

        if (this.request.geoIp && this.request.geoIp.country)
            try {
                if (!this.user.regCountry) {
                    await this.userManager.setRegLocation(this.user.id, this.request.geoIp.country, this.request.geoIp.regionCode);
                    this.user.country = this.request.geoIp.country;
                    this.user.regCountry = this.request.geoIp.country;
                    this.user.regState = this.request.geoIp.regionCode;
                }

                if (!this.user.country) {
                    await this.userManager.setCountry(this.user.id, this.request.geoIp.country);
                    this.user.country = this.request.geoIp.country;
                }
            } catch (err) {
                Logger.error(err);
            }

        return this.mapper.map(this.user);
    }

    /**
     * @summary Checks the supplied display name for availability and validity
     */
    @Tags('User')
    @Post('display-name/check')
    @Security('cognito', ['anonymous'])
    public async checkDisplayName(@Body() check: UserDisplayNameCheckModel): Promise<DisplayNameValidationResult> {
        return this.userManager.validateDisplayName(check.name, this.user?.id);
    }

    /**
     * @summary Sets the authenticated users display name
     */
    @Tags('User')
    @Response<NotFoundError>(404, 'User not found')
    @Put('display-name')
    public async setDisplayName(@Body() change: UserDisplayNameChangeModel): Promise<void> {
        // TODO: Add level -> feature configuration
        if (this.user.displayName && this.user.level <= 1)
            throw new ForbiddenError('You do not have access to this feature.');

        await this.userManager.setDisplayName(this.user.id, change.name);
    }

    /**
     * @summary Sets the authenticated users currency
     */
    @Tags('User')
    @Response<NotFoundError>(404, 'User not found')
    @Response<ConflictError>(409, 'User currency has already been set.')
    @Put('currency')
    public async setCurrency(@Body() change: UserCurrencyChangeModel): Promise<void> {
        await this.userManager.setCurrency(this.user.id, change.currencyCode);
    }

    /**
     * @summary Sets the authenticated users country
     */
    @Tags('User')
    @Response<NotFoundError>(404, 'User not found')
    @Put('country')
    public async setCountry(@Body() change: UserCountryChangeModel): Promise<void> {
        // TODO: Add level -> feature configuration
        if (this.user.level <= 1)
            throw new ForbiddenError('You do not have access to this feature.');

        await this.userManager.setCountry(this.user.id, change.country);
    }

    /**
     * @summary Sets user metadata
     */
    @Tags('User')
    @Response<NotFoundError>(404, 'User not found')
    @Post('metadata')
    public async setMetadata(@Body() metadata: UserMetadataModel): Promise<void> {
        await this.userManager.setMetadata(this.user.id, metadata as UserMetadata);
    }
}
