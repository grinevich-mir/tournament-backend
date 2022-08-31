import { Singleton, Inject } from '../../../core/ioc';
import { UserEntity } from '../user.entity';
import { User } from '../../user';
import { NewUser } from '../../new-user';
import uuid from 'uuid/v4';
import { UserAvatarEntityMapper } from './user-avatar.mapper';
import { UserIpEntity } from '../user-ip.entity';
import { UserIp } from '../../user-ip';
import { UserLogMessage } from '../../../core/logging';
import { UserLogEntity } from '../user-log.entity';

@Singleton
export class UserEntityMapper {
    constructor(
        @Inject private readonly avatarMapper: UserAvatarEntityMapper) {
    }

    public fromEntity(source: UserEntity): User {
        return {
            id: source.id,
            secureId: source.secureId,
            displayName: source.displayName,
            addressStatus: source.addressStatus,
            chatToken: source.chatToken,
            regCountry: source.regCountry,
            regState: source.regState,
            country: source.country,
            enabled: source.enabled,
            identityStatus: source.identityStatus,
            level: source.level,
            consecutivePlayedDays: source.consecutivePlayedDays,
            regType: source.regType,
            skinId: source.skinId,
            type: source.type,
            avatar: source.avatar ? this.avatarMapper.fromEntity(source.avatar) : undefined,
            customAvatarId: source.customAvatarId,
            lastPlayed: source.lastPlayed,
            ipAddress: source.ipAddress,
            currencyCode: source.currencyCode,
            bTag: source.bTag,
            subscribed: source.subscribed,
            subscribing: source.subscribing,
            hasPaymentMethod: source.hasPaymentMethod,
            createTime: source.createTime,
            updateTime: source.updateTime,
            metadata: source.metadata,
            clickId: source.clickId,
            fraudulent: source.fraudulent,
            profile: source.profile
        };
    }

    public newUserToEntity(source: NewUser): UserEntity {
        const entity = new UserEntity();
        entity.secureId = source.secureId || uuid();
        entity.customAvatarId = source.customAvatarId;
        entity.displayName = source.displayName;
        entity.currencyCode = source.currencyCode;
        entity.enabled = true;
        entity.type = source.type;
        entity.skinId = source.skinId;
        entity.regCountry = source.regCountry;
        entity.regState = source.regState;
        entity.country = source.country;
        entity.regType = source.regType;
        entity.bTag = source.bTag;
        entity.clickId = source.clickId;
        return entity;
    }

    public ipFromEntity(source: UserIpEntity): UserIp {
        return {
            id: source.id,
            userId: source.userId,
            ip: source.ipAddress,
            city: source.city,
            createTime: source.createTime,
            country: source.country,
            latitude: source.latitude,
            longitude: source.longitude,
            postalCode: source.postalCode,
            region: source.region
        };
    }

    public logMessageFromEntity(source: UserLogEntity): UserLogMessage {
        return {
            timestamp: source.timestamp.getTime(),
            userId: source.userId,
            type: source.type,
            originator: source.originator,
            originatorId: source.originatorId,
            application: source.application,
            action: source.action,
            data: source.data,
            user: this.fromEntity(source.user)
        };
    }
}