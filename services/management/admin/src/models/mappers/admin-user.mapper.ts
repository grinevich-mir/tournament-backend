import { Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { AdminUserModel } from '../admin-user.model';

@Singleton
@LogClass()
export class AdminUserModelMapper {
    public fromAttributes(source: AWS.CognitoIdentityServiceProvider.AttributeListType | undefined): AdminUserModel {
        const employeeAttr = source?.reduce((acc: { [x: string]: any; }, val: { [x: string]: any; }) => {
            acc[val.Name] = val.Value;
            return acc;
        }, {});

        return employeeAttr as AdminUserModel;
    }
}