import { User } from '../user';
import { Controller } from './controller';
import { UserApiRequest } from './user-api-request';

export class ClientController extends Controller<UserApiRequest<User>> {
    public get user(): User {
        return this._request?.user;
    }
}