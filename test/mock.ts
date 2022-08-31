export * from 'ts-mockito';
import { instance, mock, when } from 'ts-mockito';
import { UserApiRequest, ApiUser, AdminUser } from '@tcom/platform/lib/api';
import { User } from '@tcom/platform/lib/user';

export function mockUserRequest<T extends ApiUser>(props?: Partial<UserApiRequest<T>>): UserApiRequest<T> {
    const mockRequest = mock<UserApiRequest<T>>();

    if (props)
        for (const key of Object.keys(props))
            when((mockRequest as any)[key]).thenReturn((props as any)[key]);

    return mockRequest;
}

export function mockUser(props?: Partial<User>): User {
    const mockedUser = mock<User>();

    if (props)
        for (const key of Object.keys(props))
            when((mockedUser as any)[key]).thenReturn((props as any)[key]);

    return instance(mockedUser);
}

export function mockAdminUser(props?: Partial<AdminUser>): AdminUser {
    const mockedAdminUser = mock<AdminUser>();

    if (props)
        for (const key of Object.keys(props))
            when((mockedAdminUser as any)[key]).thenReturn((props as any)[key]);

    return instance(mockedAdminUser);
}