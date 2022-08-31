import initializeApi, { ErrorHandlerOptions } from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/revolver.controller';
import { RegisterRoutes } from './routes';

ErrorHandlerOptions.reportAll = true;
export const app = initializeApi(RegisterRoutes, false);
