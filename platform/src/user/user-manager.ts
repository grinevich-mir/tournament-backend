import { Singleton, Inject } from '../core/ioc';
import { UserRepository, UserProfileRepository, UserLogRepository } from './repositories';
import { PlatformEventDispatcher } from '../core/events';
import { UserLog, LogClass, UserLogMessage } from '../core/logging';
import { AvatarUrlResolver, AvatarProcessor, DisplayNameValidator } from './utilities';
import { UserCreatedEvent, UserUpdatedEvent, UserLevelChangedEvent, UserProfileUpdatedEvent } from './events';
import { NotFoundError, ConflictError, BadRequestError, PagedResult, GeoIpInfo, DEFAULT_REGION, ForbiddenError } from '../core';
import { UserVerificationStatus } from './user-verification-status';
import moment from 'moment';
import { UserEntityMapper, UserProfileEntityMapper } from './entities/mappers';
import { User } from './user';
import { NewUser, NewUserProfile } from './new-user';
import { UserFilter } from './user-filter';
import { UserLogMessageFilter } from './user-log-message-filter';
import { UserAvatarManager } from './user-avatar-manager';
import { UserAvatar } from './user-avatar';
import { UserCache } from './cache';
import { UserProfile } from './user-profile';
import { UserProfileUpdate } from './user-profile-update';
import { DisplayNameValidationResult } from './display-name-validation-result';
import { UserAddressStatus } from './user-address-status';
import { UserIp } from './user-ip';
import { SkinManager } from '../skin';
import AWS from 'aws-sdk';
import countryList from 'country-list';
import { UserType } from './user-type';
import { UserMetadata } from './user-metadata';

@Singleton
@LogClass()
export class UserManager {
    constructor(
        @Inject private readonly cache: UserCache,
        @Inject private readonly userRepository: UserRepository,
        @Inject private readonly profileRepository: UserProfileRepository,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher,
        @Inject private readonly avatarManager: UserAvatarManager,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver,
        @Inject private readonly avatarProcessor: AvatarProcessor,
        @Inject private readonly entityMapper: UserEntityMapper,
        @Inject private readonly profileEntityMapper: UserProfileEntityMapper,
        @Inject private readonly displayNameValidator: DisplayNameValidator,
        @Inject private readonly skinManager: SkinManager,
        @Inject private readonly userLog: UserLog,
        @Inject private readonly userLogRepository: UserLogRepository) {
    }

    public async getAll(filter?: UserFilter): Promise<PagedResult<User>> {
        const result = await this.userRepository.getAll(filter);
        const users = result.items.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(users, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: number | string, cacheOnly?: boolean): Promise<User | undefined> {
        const cached = await this.cache.get(id);

        if (cached || cacheOnly)
            return cached;

        const entity = await this.userRepository.get(id);

        if (!entity)
            return undefined;

        const user = this.entityMapper.fromEntity(entity);
        await this.cache.store(user);
        return user;
    }

    public async exists(id: number | string): Promise<boolean> {
        const cached = await this.cache.exists(id);
        return cached || this.userRepository.exists(id);
    }

    public async add(newUser: NewUser): Promise<User> {
        const entity = this.entityMapper.newUserToEntity(newUser);
        const avatar = await this.avatarManager.getRandom(newUser.skinId);

        if (!avatar)
            throw new Error(`Could not select random avatar.`);

        entity.avatarId = avatar.id;
        entity.displayName = await this.generateDisplayName(newUser);

        const created = await this.userRepository.add(entity);
        const profile = await this.addProfile(created.id, newUser);

        this.userLog.success(created.id, 'User:Create');
        const user = this.entityMapper.fromEntity(created);
        user.avatar = avatar;
        await this.cache.store(user);
        await this.eventDispatcher.send(new UserCreatedEvent(user, profile, newUser.referredCode));
        return user;
    }

    public async setChatToken(id: number, token: string): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                return;

            user.chatToken = token;
            user.updateTime = new Date();
            await this.userRepository.setChatToken(id, token);
            await this.cache.store(user);
        });
    }

    public async isOnline(id: number): Promise<boolean> {
        return this.cache.isOnline(id);
    }

    public async setOnline(id: number, online: boolean): Promise<void> {
        await this.cache.setOnline(id, online);
    }

    public async setEnabled(id: number, enabled: boolean): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                return;

            if (user.enabled === enabled)
                return;

            const logAction = enabled ? 'Enabled' : 'Disabled';
            await this.userLog.handle(id, `User:${logAction}`, async () => {
                // Set in Cognito
                const skin = await this.skinManager.get(user.skinId);

                if (!skin)
                    throw new NotFoundError(`Skin '${user.skinId}' not found.`);

                const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });

                const listResponse = await cognito.listUsers({
                    UserPoolId: skin.userPoolId,
                    Filter: `sub = "${user.secureId}"`,
                    Limit: 1
                }).promise();

                if (!listResponse.Users || listResponse.Users.length === 0)
                    throw new NotFoundError('Cognito user not found.');

                const cognitoUser = listResponse.Users[0];

                if (enabled)
                    await cognito.adminEnableUser({
                        UserPoolId: skin.userPoolId,
                        Username: cognitoUser.Username as string
                    }).promise();
                else
                    await cognito.adminDisableUser({
                        UserPoolId: skin.userPoolId,
                        Username: cognitoUser.Username as string
                    }).promise();

                user.enabled = enabled;
                user.updateTime = new Date();
                await this.userRepository.setEnabled(id, enabled);

                await this.cache.store(user);
                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id,
                    enabled
                }));
            });
        });
    }

    public async getProfile(id: number): Promise<UserProfile | undefined> {
        const entity = await this.profileRepository.get(id);

        if (!entity)
            return undefined;

        return this.profileEntityMapper.fromEntity(entity);
    }

    public async getProfileByEmail(email: string): Promise<UserProfile | undefined> {
        const entity = await this.profileRepository.getByEmail(email);

        if (!entity)
            return undefined;

        return this.profileEntityMapper.fromEntity(entity);
    }

    public async addProfile(id: number, profile: NewUserProfile): Promise<UserProfile> {
        return this.userLog.handle(id, 'User:Profile:Create', async () => {
            const entity = this.profileEntityMapper.newToEntity(id, profile);
            const created = await this.profileRepository.add(entity);
            return this.profileEntityMapper.fromEntity(created);
        });
    }

    public async setProfile(id: number, update: UserProfileUpdate): Promise<void> {
        await this.userLog.handle(id, 'User:Profile:Update', async () => {
            if (update.mobileNumber && update.mobileNumberVerified === undefined)
                update.mobileNumberVerified = false;

            const entity = this.profileEntityMapper.updateToEntity(id, update);
            await this.profileRepository.update(entity);
            await this.eventDispatcher.send(new UserProfileUpdatedEvent(id, update));
        });

        if (update.address && update.address.country && update.address.zipCode) {
            let addressStatus = UserAddressStatus.Partial;

            if (update.address.line1 && update.address.city)
                addressStatus = UserAddressStatus.Complete;

            await this.setAddressStatus(id, addressStatus);
        }
    }

    public async validateDisplayName(displayName: string, requestingUserId?: number): Promise<DisplayNameValidationResult> {
        if (!displayName)
            throw new BadRequestError('Display name was not supplied.');

        if (requestingUserId) {
            const user = await this.get(requestingUserId);

            if (user?.displayName?.toLowerCase() === displayName.toLowerCase())
                return {
                    valid: true,
                    available: true
                };
        }

        const validation = await this.displayNameValidator.validate(displayName);
        let available = false;

        if (validation.valid)
            available = !await this.cache.displayNameExists(displayName);

        return {
            ...validation,
            available
        };
    }

    public async setDisplayName(id: number, displayName: string): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            const validation = await this.validateDisplayName(displayName, id);

            if (!validation.valid)
                throw new BadRequestError('Display name is invalid.');

            if (!validation.available)
                throw new ConflictError('Display name is not available.');

            await this.userLog.handle(id, 'User:DisplayName:Set', async (logData) => {
                logData.displayName = displayName;

                await this.userRepository.setDisplayName(id, displayName);

                if (user.displayName)
                    await this.cache.removeDisplayName(user.displayName);

                user.displayName = displayName;
                user.updateTime = new Date();
                await this.cache.store(user);
                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id,
                    type: user.type,
                    displayName
                }));
            });
        });
    }

    public async setAvatar(id: number, avatarId: number): Promise<UserAvatar> {
        return this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            return this.userLog.handle(id, 'User:Avatar:Set', async (logData) => {
                logData.avatarId = avatarId;

                const avatar = await this.avatarManager.get(avatarId);

                if (!avatar || avatar.skinId !== user.skinId)
                    throw new NotFoundError('Avatar not found.');

                await this.userRepository.setAvatar(id, avatarId);

                if (user.customAvatarId)
                    await this.avatarProcessor.delete(user.customAvatarId);

                user.avatar = avatar;
                user.updateTime = new Date();
                delete user.customAvatarId;
                await this.cache.store(user);

                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id,
                    type: user.type,
                    avatarUrl: avatar.url
                }));

                return avatar;
            });
        });
    }

    public async setCustomAvatar(id: number, avatarId: string): Promise<string> {
        return this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            return this.userLog.handle(id, 'User:CustomAvatar:Set', async (logData) => {
                logData.customAvatarId = avatarId;

                const currentId = user.customAvatarId;

                await this.userRepository.setCustomAvatar(id, avatarId);
                user.customAvatarId = avatarId;
                user.updateTime = new Date();
                await this.cache.store(user);

                if (currentId)
                    await this.avatarProcessor.delete(currentId);

                const avatarUrl = this.avatarUrlResolver.resolve(avatarId);

                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id: user.id,
                    type: user.type,
                    avatarUrl
                }));

                return avatarUrl;
            });
        });
    }

    public async setCurrency(id: number, currencyCode: string): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userLog.handle(id, 'User:Currency:Set', async (logData) => {
                logData.currencyCode = currencyCode;

                if (user.currencyCode)
                    throw new ConflictError('User currency has already been set.');

                await this.userRepository.setCurrency(id, currencyCode);
                user.currencyCode = currencyCode;
                user.updateTime = new Date();

                await this.cache.store(user);
                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id: user.id,
                    type: user.type,
                    currencyCode
                }));
            });
        });
    }

    public async setCountry(id: number, country: string): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userLog.handle(id, 'User:Country:Set', async (logData) => {
                const countryName = countryList.getName(country);

                if (!countryName || country.length !== 2)
                    throw new BadRequestError(`Invalid country code: ${country}`);

                logData.country = country;

                await this.userRepository.setCountry(id, country);

                user.country = country;
                user.updateTime = new Date();

                await this.cache.store(user);
                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id,
                    type: user.type,
                    country
                }));
            });
        });
    }

    public async setRegLocation(id: number, country: string, state?: string): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            const countryName = countryList.getName(country);

            if (!countryName || country.length !== 2)
                throw new BadRequestError(`Invalid country code: ${country}`);

            await this.userRepository.setRegLocation(id, country, state);

            user.country = country;
            user.regCountry = country;
            user.regState = state;
            user.updateTime = new Date();

            await this.cache.store(user);
            await this.eventDispatcher.send(new UserUpdatedEvent({
                id,
                type: user.type,
                country,
                regCountry: country,
                regState: state
            }));
        });
    }

    public async setIdentityStatus(id: number, status: UserVerificationStatus): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userLog.handle(id, 'User:IdentityStatus:Set', async (logData) => {
                logData.identityStatus = status;
                await this.userRepository.setIdentityStatus(id, status);
                user.identityStatus = status;
                user.updateTime = new Date();
                await this.cache.store(user);

                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id,
                    type: user.type,
                    identityStatus: status
                }));
            });
        });
    }

    public async setAddressStatus(id: number, status: UserAddressStatus): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userLog.handle(id, 'User:AddressStatus:Set', async (logData) => {
                logData.identityStatus = status;
                await this.userRepository.setAddressStatus(id, status);
                user.addressStatus = status;
                user.updateTime = new Date();
                await this.cache.store(user);

                await this.eventDispatcher.send(new UserUpdatedEvent({
                    id,
                    type: user.type,
                    addressStatus: status
                }));
            });
        });
    }

    public async setLevel(id: number, level: number): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userLog.handle(id, 'User:Level:Set', async () => {
                const currentLevel = user.level;

                if (currentLevel === level)
                    return;

                await this.userRepository.setLevel(id, level);
                user.level = level;
                user.updateTime = new Date();
                await this.cache.store(user);
                await this.eventDispatcher.send(new UserLevelChangedEvent(id, currentLevel, level));
            });
        });
    }

    public async setSubscriptionState(id: number, values: { subscribed?: boolean, subscribing?: boolean; }): Promise<void> {
        if (!Object.keys(values).length)
            throw new Error('No values set.');

        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userRepository.setSubscriptionState(id, values);

            if (values.subscribed !== undefined)
                user.subscribed = values.subscribed;
            if (values.subscribing !== undefined)
                user.subscribing = values.subscribing;

            user.updateTime = new Date();
            await this.cache.store(user);
        });
    }

    public async setHasPaymentMethod(id: number, value: boolean): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userRepository.setHasPaymentMethod(id, value);

            user.hasPaymentMethod = value;
            user.updateTime = new Date();
            await this.cache.store(user);
        });
    }

    public async setType(id: number, type: UserType): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            if (user.type !== UserType.Standard)
                throw new ForbiddenError(`Current user type is ${user.type} and cannot be changed.`);

            await this.userRepository.setType(id, type);
            user.type = type;
            user.updateTime = new Date();
            await this.cache.store(user);
            await this.eventDispatcher.send(new UserUpdatedEvent({
                id,
                type
            }));
        });
    }

    public async updateLastPlayed(id: number): Promise<[number, number]> {
        return this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new Error('User not found.');

            const previousPlayedDays = user.consecutivePlayedDays;
            let consecutivePlayedDays = user.consecutivePlayedDays;

            const lastPlayed = moment(user.lastPlayed).utc();
            const lastPlayedNextDay = moment(lastPlayed).add(1, 'day');
            const now = moment().utc();

            if (now.isSame(lastPlayedNextDay, 'date'))
                consecutivePlayedDays += 1;
            else if (!now.isSame(lastPlayed, 'date'))
                consecutivePlayedDays = 1;

            const date = new Date();
            await this.userRepository.updateLastPlayed(id, date, consecutivePlayedDays);
            user.lastPlayed = date;
            user.consecutivePlayedDays = consecutivePlayedDays;
            user.updateTime = date;
            await this.cache.store(user);

            return [consecutivePlayedDays, previousPlayedDays];
        });
    }

    public async updateIpData(id: number, ipAddress: string, geoip?: GeoIpInfo): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new Error('User not found.');

            await this.userRepository.updateIpAddress(id, ipAddress);
            await this.userRepository.addIpData(id, ipAddress, geoip);
            user.ipAddress = ipAddress;
            user.updateTime = new Date();
            await this.cache.store(user);
        });
    }

    public async getIpHistory(id: number): Promise<UserIp[]> {
        const entities = await this.userRepository.getIpHistory(id);

        if (entities.length === 0)
            return [];

        return entities.map(e => this.entityMapper.ipFromEntity(e));
    }

    public async getUsersByIp(ip: string): Promise<User[]> {
        const entities = await this.userRepository.getUsersByIp(ip);


        if (entities.length === 0)
            return [];

        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async refreshDisplayNameCache(): Promise<void> {
        const displayNames = await this.userRepository.getAllDisplayNames();
        await this.cache.storeDisplayNames(displayNames);
    }

    private async generateDisplayName(user: NewUser): Promise<string | undefined> {
        const emailStart = user.email.split('@')[0];
        const pattern = new RegExp(/[^a-zA-Z0-9_.]/, 'gi');
        const safeDisplayName = (user.displayName || emailStart).slice(0, 20).replace(pattern, '_');

        const result = await this.displayNameValidator.validate(safeDisplayName);
        if (!result.valid)
            return undefined;

        let num = 0;
        let displayName = safeDisplayName;
        while (await this.cache.displayNameExists(displayName)) {
            num++;
            displayName = safeDisplayName.slice(0, 20 - num.toString().length) + num;
        }

        return displayName;
    }

    public async getAllUserLogMessages(filter?: UserLogMessageFilter): Promise<PagedResult<UserLogMessage>> {
        const result = await this.userLogRepository.getAll(filter);
        const userLogMessages = result.items.map(e => this.entityMapper.logMessageFromEntity(e));
        return new PagedResult(userLogMessages, result.totalCount, result.page, result.pageSize);
    }

    public async setMetadata(id: number, metadata: Partial<UserMetadata>): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            const data = Object.assign({}, user.metadata, metadata);
            await this.userRepository.setMetadata(id, data);
            user.metadata = data;
            await this.cache.store(user);
        });
    }

    public async setFraudulent(id: number, fraudulent: boolean): Promise<void> {
        await this.cache.lock(id, async () => {
            const user = await this.get(id);

            if (!user)
                throw new NotFoundError('User not found.');

            await this.userRepository.setFraudulent(id, fraudulent);
            user.fraudulent = fraudulent;
            await this.cache.store(user);
        });
    }
}
