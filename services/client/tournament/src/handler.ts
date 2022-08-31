import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/history.controller';
import './controllers/launch.controller';
import './controllers/winner.controller';
import './controllers/intro.controller';
import './controllers/tournament.controller';
import { RegisterRoutes } from './routes';
import { LogOriginator, LogContextResolver } from '@tcom/platform/lib/core/logging';

LogContextResolver.default.originator = LogOriginator.User;
export const app = initializeApi(RegisterRoutes);
