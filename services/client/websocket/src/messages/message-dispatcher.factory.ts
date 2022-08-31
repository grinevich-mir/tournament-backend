import { IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { MessageTarget } from '@tcom/platform/lib/websocket';
import { BroadcastMessageDispatcher } from './dispatchers/broadcast.dispatcher';
import { ConnectionMessageDispatcher } from './dispatchers/connection.dispatcher';
import { TopicsMessageDispatcher } from './dispatchers/topics.dispatcher';
import { UserMessageDispatcher } from './dispatchers/user.dispatcher';
import { UsersMessageDispatcher } from './dispatchers/users.dispatcher';
import { IMessageDispatcher } from './message.interfaces';

@Singleton
export class MessageDispatcherFactory {
    public create<T extends MessageTarget>(target: T): IMessageDispatcher<T> | undefined {
        switch (target.type) {
            case 'Broadcast':
                return IocContainer.get(BroadcastMessageDispatcher) as IMessageDispatcher<T>;

            case 'Topics':
                return IocContainer.get(TopicsMessageDispatcher) as IMessageDispatcher<T>;

            case 'User':
                return IocContainer.get(UserMessageDispatcher) as IMessageDispatcher<T>;

            case 'Users':
                return IocContainer.get(UsersMessageDispatcher) as IMessageDispatcher<T>;

            case 'Connection':
                return IocContainer.get(ConnectionMessageDispatcher) as IMessageDispatcher<T>;
        }
    }
}