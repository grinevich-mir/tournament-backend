import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/statistics.controller';
import './controllers/revolver-statistics.controller';
import { RegisterRoutes } from './routes';

export const app = initializeApi(RegisterRoutes);
