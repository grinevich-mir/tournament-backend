import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/notification-setting.controller';
import './controllers/verification.controller';
import './controllers/profile.controller';
import './controllers/avatar.controller';
import './controllers/user.controller';
import { RegisterRoutes } from './routes';
import { LogOriginator, LogContextResolver } from '@tcom/platform/lib/core/logging';

LogContextResolver.default.originator = LogOriginator.User;
export const app = initializeApi(RegisterRoutes);
