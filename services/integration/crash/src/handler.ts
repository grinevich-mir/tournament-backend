import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/crash.controller';
import { RegisterRoutes } from './routes';
import { CrashAuthenticator } from './auth';

export const app = initializeApi(RegisterRoutes, { crash: CrashAuthenticator });
