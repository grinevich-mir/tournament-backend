import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/admin-user.controller';
import './controllers/role-permissions.controller';
import './controllers/user-roles.controller';
import './controllers/user-permissions.controller';
import './controllers/admin-log.controller';
import { RegisterRoutes } from './routes';

export const app = initializeApi(RegisterRoutes);