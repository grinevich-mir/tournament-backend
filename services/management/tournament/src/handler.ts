import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/tournament-template.controller';
import './controllers/intro.controller';
import './controllers/tournament.controller';
import { RegisterRoutes } from './routes';
import { LogOriginator, LogContextResolver } from '@tcom/platform/lib/core/logging';

LogContextResolver.default.originator = LogOriginator.Employee;
export const app = initializeApi(RegisterRoutes);
