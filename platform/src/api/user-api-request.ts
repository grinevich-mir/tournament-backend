import { ApiUser } from './api-user';
import { ApiRequest } from './api-request';

export interface UserApiRequest<T extends ApiUser> extends ApiRequest {
    user: T;
}