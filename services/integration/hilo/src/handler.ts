import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/hilo.controller';
import { RegisterRoutes } from './routes';
import { HiloAuthenticator } from './auth';

export const app = initializeApi(RegisterRoutes, { hilo: HiloAuthenticator });
