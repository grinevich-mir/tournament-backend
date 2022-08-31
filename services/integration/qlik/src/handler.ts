import initializeApi, { ErrorHandlerOptions } from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/qlik.controller';
import { RegisterRoutes } from './routes';
import { QlikAuthenticator } from './auth';

ErrorHandlerOptions.reportAll = true;
export const app = initializeApi(RegisterRoutes, { qlik: QlikAuthenticator });
