import { Role } from './role';

export interface RolePermissions {
    role: Role;
    fullAccess: boolean;
    scopes: string[];
}