import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { UserLevelChangedEvent } from '@tcom/platform/lib/user/events';
import { IocContainer, Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TargettedMessage, UserTarget } from '@tcom/platform/lib/websocket';
import { MessageDispatcherFactory } from '../messages/message-dispatcher.factory';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger from '@tcom/platform/lib/core/logging';

@Singleton
class OnUserLevelChangedHandler extends PlatformEventHandler<UserLevelChangedEvent> {
    constructor(
        @Inject private readonly dispatcherFactory: MessageDispatcherFactory) {
        super();
    }

    protected async process(event: Readonly<UserLevelChangedEvent>): Promise<void> {
        const message: TargettedMessage<UserTarget> = {
            type: 'User:LevelChanged',
            $target: {
                type: 'User',
                userId: event.id
            },
            payload: {
                from: event.from,
                to: event.to
            }
        };

        const dispatcher = this.dispatcherFactory.create(message.$target);

        if (!dispatcher) {
            Logger.warn(`Unsupported message target '${JSON.stringify(message.$target)}'.`);
            return;
        }

        await dispatcher.dispatch(message);
    }
}

export const onUserLevelChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserLevelChangedHandler).execute(event));