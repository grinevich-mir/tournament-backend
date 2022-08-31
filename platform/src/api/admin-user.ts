import { ApiUser } from './api-user';

export class AdminUser extends ApiUser {
    constructor(
        public readonly id: string,
        public readonly username: string) {
        super();
    }
}