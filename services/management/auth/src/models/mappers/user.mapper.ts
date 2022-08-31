import { Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UserModel, UserStatus } from '../user.model';
import moment from 'moment';

interface AWSCognitoUserAttributes {
    sub: string;
    name: string;
    family_name: string;
    email: string;
    email_verified: boolean;
    phone_number: string;
    phone_number_verified: boolean;
}

@Singleton
@LogClass()
export class UserModelMapper {
    public fromUserType(user: AWS.CognitoIdentityServiceProvider.UserType): UserModel {
        const attr = user.Attributes?.reduce(
            (acc, { Name, Value }) => ({ ...acc, [Name]: Value }),
            {}) as AWSCognitoUserAttributes;

        return {
            firstName: attr.name,
            lastName: attr.family_name,
            email: attr.email,
            emailVerified: attr.email_verified,
            phone: attr.phone_number,
            phoneVerified: attr.phone_number_verified,
            status: user.UserStatus as UserStatus,
            username: String(user.Username),
            createdAt: moment(user.UserCreateDate).format(),
            updatedAt: moment(user.UserLastModifiedDate).format(),
            enabled: Boolean(user.Enabled)
        };
    }
}