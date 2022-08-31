import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/currency.controller';
import './controllers/wallet.controller';
import './controllers/withdrawal.controller';
import { RegisterRoutes } from './routes';
import { LogOriginator, LogContextResolver } from '@tcom/platform/lib/core/logging';

LogContextResolver.default.originator = LogOriginator.User;
export const app = initializeApi(RegisterRoutes);
