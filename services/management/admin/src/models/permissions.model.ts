import { RolePermissions } from '@tcom/platform/lib/permissions';

export type UpdatePermissionsModel = Omit<RolePermissions, 'role'>;