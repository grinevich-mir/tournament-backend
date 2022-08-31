import { Role } from './role';

export interface UserPermissions {
    roles: Role[];
    scopes: string[];
    fullAccess: boolean;
}