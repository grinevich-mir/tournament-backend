import { MessageTarget, TargettedMessage } from '@tcom/platform/lib/websocket';

export interface IMessageDispatcher<T extends MessageTarget> {
    dispatch(message: TargettedMessage<T>): Promise<void>;
}
