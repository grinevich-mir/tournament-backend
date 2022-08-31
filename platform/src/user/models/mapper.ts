import { Singleton, Inject } from '../../core/ioc';
import { UserModel } from './user.model';
import { UserAvatarModel } from './user-avatar.model';
import moment from 'moment';
import { AvatarUrlResolver } from '../utilities';
import { User } from '../user';
import { UserAvatar } from '../user-avatar';
import { UserProfileUpdateModel } from './user-profile.model';
import { UserProfileUpdate } from '../user-profile-update';

@Singleton
export class UserModelMapper {
    constructor(
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver) {
        }

    public map(source: User): UserModel {
        const yesterday = moment().utc().subtract(1, 'day');
        let consecutivePlayedDays = 0;

        if (moment(source.lastPlayed).isSame(yesterday, 'day'))
            consecutivePlayedDays = source.consecutivePlayedDays;

        return {
            id: source.id,
            secureId: source.secureId,
            displayName: source.displayName,
            skinId: source.skinId,
            avatarUrl: this.avatarUrlResolver.resolve(source),
            chatToken: source.chatToken,
            currency: source.currencyCode,
            regCountry: source.regCountry || 'US',
            level: source.level,
            country: source.country || 'US',
            identityStatus: source.identityStatus,
            addressStatus: source.addressStatus,
            lastPlayed: source.lastPlayed,
            consecutivePlayedDays,
            subscribed: source.subscribed,
            subscribing: source.subscribing,
            hasPaymentMethod: source.hasPaymentMethod,
            metadata: source.metadata
        };
    }

    public mapAvatar(source: UserAvatar): UserAvatarModel {
        return  {
            id: source.id,
            url: source.url
        };
    }

    public mapProfileUpdate(source: UserProfileUpdateModel): UserProfileUpdate {
        return {
            forename: source.forename,
            surname: source.surname,
            dob: source.dob,
            address: source.address,
            taxId: source.taxId
        };
    }
}
