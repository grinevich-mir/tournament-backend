import { Controller } from './controller';
import { UserApiRequest } from './user-api-request';
import { AdminUser } from './admin-user';

export class AdminController extends Controller<UserApiRequest<AdminUser>> {
    public get user(): AdminUser {
        return this._request?.user;
    }
}