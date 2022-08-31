import initializeApi from '@tcom/platform/lib/api/api-initializer';
// Import All Controllers: Required for swagger and route generation
import './controllers/blackjack.controller';
import { RegisterRoutes } from './routes';
import { BlackjackAuthenticator } from './auth';

export const app = initializeApi(RegisterRoutes, { blackjack: BlackjackAuthenticator });
