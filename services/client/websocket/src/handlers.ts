import { Handler } from 'aws-lambda';

export * from './auth/auth.handler';
export * from './connections/connection.handler';
export * from './messages/message.handler';
export * from './subscriptions/subscription.handler';
export * from './events/on-user-level-changed.handler';

export const defaultHandler: Handler = async (event: any): Promise<void> => {
    console.error('Unexpected websocket event', JSON.stringify(event));
};