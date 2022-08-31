import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/phone-whitelist.controller';
import './controllers/user.controller';
import { RegisterRoutes } from './routes';

export const app = initializeApi(RegisterRoutes);
