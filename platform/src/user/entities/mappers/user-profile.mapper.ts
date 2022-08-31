import { NewUserProfile } from '../../new-user';
import { Singleton } from '../../../core/ioc';
import { UserProfile } from '../../user-profile';
import { UserAddress } from '../../user-address';
import { UserProfileUpdate } from '../../user-profile-update';
import { UserProfileEntity } from '../user-profile.entity';
import { UserAddressEntity } from '../user-address.entity';

@Singleton
export class UserProfileEntityMapper {
    public fromEntity(source: UserProfileEntity): UserProfile {
        return {
            userId: source.userId,
            mobileNumber: source.mobileNumber,
            mobileVerified: source.mobileVerified,
            address: source.address ? this.addressFromEntity(source.address) : undefined,
            email: source.email,
            emailVerified: source.emailVerified,
            dob: source.dob,
            forename: source.forename,
            surname: source.surname,
            taxId: source.taxId,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(userId: number, source: NewUserProfile): UserProfileEntity {
        const entity = new UserProfileEntity();
        entity.userId = userId;
        entity.forename = source.forename;
        entity.surname = source.surname;
        entity.mobileNumber = source.mobileNumber;
        entity.mobileVerified = source.mobileVerified === true;
        entity.email = source.email;
        entity.emailVerified = source.emailVerified === true;
        entity.dob = source.dob;
        entity.taxId = source.taxId;
        return entity;
    }

    public updateToEntity(userId: number, source: UserProfileUpdate): UserProfileEntity {
        const entity = new UserProfileEntity();
        entity.userId = userId;

        if (source.forename)
            entity.forename = source.forename;
        if (source.surname)
            entity.surname = source.surname;
        if (source.mobileNumber)
            entity.mobileNumber = source.mobileNumber;
        if (source.mobileNumberVerified !== undefined)
            entity.mobileVerified = source.mobileNumberVerified;
        if (source.email)
            entity.email = source.email;
        if (source.dob)
            entity.dob = source.dob;
        if (source.address)
            entity.address = this.addressToEntity(userId, source.address);
        if (source.taxId)
            entity.taxId = source.taxId;

        return entity;
    }

    public addressFromEntity(source: UserAddressEntity): UserAddress {
        return {
            line1: source.line1,
            line2: source.line2,
            line3: source.line3,
            city: source.city,
            country: source.country,
            state: source.state,
            zipCode: source.zipCode
        };
    }

    public addressToEntity(userId: number, source: UserAddress): UserAddressEntity {
        const entity = new UserAddressEntity();
        entity.profileUserId = userId;
        entity.line1 = (source.line1 || null) as string;
        entity.line2 = (source.line2 || null) as string;
        entity.line3 = (source.line3 || null) as string;
        entity.country = source.country;
        entity.city = (source.city || null) as string;
        entity.state = (source.state || null) as string;
        entity.zipCode = source.zipCode;
        return entity;
    }
}