import initializeApi, { ErrorHandlerOptions } from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/tambola.controller';
import { RegisterRoutes } from './routes';
import { TambolaAuthenticator } from './auth';

ErrorHandlerOptions.reportAll = true;
export const app = initializeApi(RegisterRoutes, { tambola: TambolaAuthenticator });
